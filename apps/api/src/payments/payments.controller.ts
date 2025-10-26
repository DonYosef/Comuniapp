import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FlowService } from './flow.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly flowService: FlowService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /payments/expense/:expenseId
   * Crea una orden de pago en Flow para un gasto específico
   */
  @Post('expense/:expenseId')
  @UseGuards(JwtAuthGuard)
  async createExpensePayment(@Param('expenseId') expenseId: string, @Request() req: any) {
    try {
      const userId = req.user.id;

      // 1. Verificar que el Expense existe y está PENDING
      const expense = await this.prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          unit: {
            include: {
              userUnits: {
                where: {
                  userId: userId,
                  status: 'CONFIRMED',
                },
              },
            },
          },
        },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      if (expense.status !== 'PENDING') {
        throw new ConflictException('Expense is not pending payment');
      }

      // 2. Verificar que el usuario tiene acceso a la unidad
      if (expense.unit.userUnits.length === 0) {
        throw new UnauthorizedException('You do not have access to this unit');
      }

      // 3. Verificar que no haya un pago PAID ya existente
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          expenseId: expenseId,
          status: 'PAID',
        },
      });

      if (existingPayment) {
        throw new ConflictException('This expense has already been paid');
      }

      // 4. Obtener datos del usuario
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      // 5. Crear orden en Flow
      const commerceOrder = `${expenseId}-${Date.now()}`;
      const subject = `Pago gasto común: ${expense.concept}`;
      // Flow requiere montos CLP como enteros (sin decimales)
      const amount = Math.round(expense.amount.toNumber());

      const flowOrder = await this.flowService.createOrder({
        commerceOrder,
        subject,
        amount,
        email: user.email,
        optionalData: {
          expenseId: expenseId,
          userId: userId,
        },
      });

      // 6. Crear registro Payment en estado PENDING
      const payment = await this.prisma.payment.create({
        data: {
          userId: userId,
          expenseId: expenseId,
          amount: expense.amount,
          method: 'FLOW' as any,
          status: 'PENDING',
          reference: flowOrder.token, // Guardar token de Flow
          flowOrder: flowOrder.flowOrder as string | null, // Guardar flowOrder para auditoría
        } as any,
      });

      this.logger.log(
        `💳 Payment created: ${payment.id} - Flow order: ${flowOrder.flowOrder} - Token: ${flowOrder.token}`,
      );

      // 7. Retornar URL de checkout
      return {
        success: true,
        checkoutUrl: flowOrder.checkoutUrl,
        paymentId: payment.id,
        token: flowOrder.token,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error creating expense payment: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * POST /payments/flow/confirmation
   * Webhook de confirmación de Flow
   */
  @Post('flow/confirmation')
  @HttpCode(HttpStatus.OK)
  async flowConfirmation(@Body() body: any) {
    try {
      this.logger.log(`📥 Flow confirmation received: ${JSON.stringify(body)}`);

      const token = body.token;

      if (!token) {
        this.logger.warn('⚠️ Flow confirmation received without token');
        return { success: true };
      }

      // 1. Consultar estado actual en Flow
      const orderStatus = await this.flowService.getOrderStatus(token);

      // 2. Buscar el Payment por reference (token)
      const payment = await this.prisma.payment.findFirst({
        where: { reference: token },
        include: {
          expense: true,
        },
      });

      if (!payment) {
        this.logger.warn(`⚠️ Payment not found for token: ${token}`);
        return { success: true };
      }

      // 3. Prevenir actualizaciones si ya está PAID (idempotencia)
      if (payment.status === 'PAID') {
        this.logger.log(`✅ Payment already PAID: ${payment.id}`);
        return { success: true };
      }

      // 4. Actualizar según el status de Flow
      if (orderStatus.status === 2) {
        // Pagado
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              paymentDate: new Date(),
            },
          }),
          this.prisma.expense.update({
            where: { id: payment.expenseId },
            data: {
              status: 'PAID',
            },
          }),
        ]);

        this.logger.log(`✅ Payment PAID: ${payment.id} - Expense: ${payment.expenseId}`);
      } else if (orderStatus.status === 3 || orderStatus.status === 4) {
        // Rechazado o anulado
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
          },
        });

        this.logger.log(`❌ Payment FAILED: ${payment.id} - Flow status: ${orderStatus.status}`);
      } else {
        this.logger.log(
          `⏳ Payment still PENDING: ${payment.id} - Flow status: ${orderStatus.status}`,
        );
      }

      return { success: true };
    } catch (error: any) {
      this.logger.error(
        `❌ Error processing Flow confirmation: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      // Siempre retornar 200 para que Flow no reintente
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * GET /payments/status?token=...
   * Consulta el estado de un pago por token de Flow
   */
  @Get('status')
  async getPaymentStatus(@Query('token') token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token is required');
      }

      // 1. Consultar estado en Flow
      const flowStatus = await this.flowService.getOrderStatus(token);

      // 2. Buscar Payment local
      const payment = await this.prisma.payment.findFirst({
        where: { reference: token },
        include: {
          expense: {
            select: {
              id: true,
              concept: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      return {
        success: true,
        flow: {
          status: flowStatus.status,
          statusText: this.getStatusText(flowStatus.status),
          flowOrder: flowStatus.flowOrder,
          commerceOrder: flowStatus.commerceOrder,
          amount: flowStatus.amount,
        },
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              paymentDate: payment.paymentDate,
              expense: payment.expense,
            }
          : null,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error getting payment status: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Convierte el status numérico de Flow a texto
   */
  private getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Pendiente';
      case 2:
        return 'Pagado';
      case 3:
        return 'Rechazado';
      case 4:
        return 'Anulado';
      default:
        return 'Desconocido';
    }
  }
}
