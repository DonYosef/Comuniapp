import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { FlowService } from './flow.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly flowService: FlowService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /payments/expense/:expenseId
   * Crea una orden de pago en Flow para un gasto común
   */
  @Post('expense/:expenseId')
  @ApiOperation({ summary: 'Crear orden de pago en Flow para un gasto común' })
  @ApiResponse({
    status: 200,
    description: 'Orden de pago creada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'El gasto ya está pagado o no existe' })
  async createExpensePayment(@Param('expenseId') expenseId: string, @Req() req: RequestWithUser) {
    try {
      const userId = req.user.id;

      // 1. Verificar que el gasto existe y no está pagado
      const expense = await this.prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          unit: {
            include: {
              community: true,
            },
          },
        },
      });

      if (!expense) {
        throw new Error('Gasto no encontrado');
      }

      if (expense.status !== 'PENDING') {
        throw new Error(`El gasto ya está ${expense.status}. No se puede pagar.`);
      }

      // 2. Verificar que el usuario está asociado a la unidad
      const userUnit = await this.prisma.userUnit.findFirst({
        where: {
          userId: userId,
          unitId: expense.unitId,
          status: 'CONFIRMED',
        },
      });

      if (!userUnit) {
        throw new Error('No tienes acceso a esta unidad o no estás confirmado como residente');
      }

      // 3. Obtener datos del usuario
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // 4. Crear orden en Flow
      const commerceOrder = `${expenseId}-${Date.now()}`;
      const subject = `Pago gasto común: ${expense.concept}`;
      const amount = Math.round(expense.amount.toNumber()); // Redondeo a entero para Flow CLP

      // IMPORTANTE: payerEmail es el email del cliente/pagador (opcional, solo para referencia)
      // El email de la cuenta de Flow se toma de FLOW_USER_EMAIL en las variables de entorno
      const flowOrder = await this.flowService.createOrder({
        commerceOrder,
        subject,
        amount,
        payerEmail: user.email, // Email del cliente, se enviará en optionalData si es necesario
        optionalData: {
          expenseId: expenseId,
          userId: userId,
          payerEmail: user.email, // Incluir email del cliente en optionalData para referencia
        },
      });

      // 5. Crear registro Payment en estado PENDING
      const payment = await this.prisma.payment.create({
        data: {
          userId: userId,
          expenseId: expenseId,
          amount: expense.amount,
          method: 'FLOW' as any,
          status: 'PENDING',
          reference: flowOrder.token,
          flowOrder: flowOrder.flowOrder as string | null,
        } as any,
      });

      this.logger.log(
        `💳 Payment created: ${payment.id} - Flow order: ${flowOrder.flowOrder} - Token: ${flowOrder.token}`,
      );

      // 6. Retornar URL de checkout
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
   * Webhook de Flow para confirmación de pagos (NO requiere autenticación JWT)
   */
  @Post('flow/confirmation')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de confirmación de pago de Flow' })
  @ApiResponse({
    status: 200,
    description: 'Confirmación procesada exitosamente',
  })
  async flowConfirmation(@Body() body: any) {
    try {
      const token = body.token;

      if (!token) {
        this.logger.warn('⚠️ Webhook recibido sin token');
        return { success: true, message: 'No token provided' };
      }

      this.logger.log(`📥 Webhook received: token=${token}`);

      // 1. Consultar estado en Flow
      const flowStatus = await this.flowService.getOrderStatus(token);

      this.logger.log(`📊 Flow status: ${flowStatus.flowOrder} - Status: ${flowStatus.status}`);

      // 2. Buscar el pago en la BD
      const payment = await this.prisma.payment.findFirst({
        where: { reference: token },
        include: {
          expense: true,
        },
      });

      if (!payment) {
        this.logger.warn(`⚠️ Payment not found for token: ${token}`);
        return { success: true, message: 'Payment not found' };
      }

      // 3. Verificar si el pago ya fue procesado (idempotencia)
      if (payment.status === 'PAID') {
        this.logger.log(`✅ Payment already processed: ${payment.id}`);
        return { success: true, message: 'Already processed' };
      }

      // 4. Actualizar según el estado de Flow
      let paymentStatus: string = payment.status;
      let expenseStatus = payment.expense.status;

      if (flowStatus.status === 2) {
        // Pagado
        paymentStatus = 'PAID';
        expenseStatus = 'PAID';

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID' as any,
            paymentDate: new Date(),
          },
        });

        await this.prisma.expense.update({
          where: { id: payment.expenseId },
          data: {
            status: 'PAID',
          },
        });

        this.logger.log(`✅ Payment ${payment.id} marked as PAID`);
      } else if (flowStatus.status === 3 || flowStatus.status === 4) {
        // Rechazado o Anulado
        paymentStatus = 'FAILED';

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED' as any,
          },
        });

        this.logger.log(`❌ Payment ${payment.id} marked as FAILED`);
      }

      return {
        success: true,
        paymentId: payment.id,
        paymentStatus,
        expenseStatus,
        flowStatus: flowStatus.status,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error processing Flow confirmation: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * POST /payments/confirm
   * Confirma manualmente un pago después de que Flow lo procese (llamado por frontend autenticado)
   */
  @Post('confirm')
  @ApiOperation({ summary: 'Confirmar pago manualmente (requiere autenticación)' })
  @ApiResponse({
    status: 200,
    description: 'Pago confirmado exitosamente',
  })
  async confirmPaymentManually(@Body() body: { token: string }, @Req() req: RequestWithUser) {
    try {
      const userId = req.user.id;
      const { token } = body;

      if (!token) {
        throw new Error('Token is required');
      }

      this.logger.log(
        `💳 Manual payment confirmation requested by user ${userId} for token: ${token.substring(0, 10)}...`,
      );

      // 1. Consultar estado en Flow
      const flowStatus = await this.flowService.getOrderStatus(token);

      this.logger.log(`📊 Flow status: ${flowStatus.flowOrder} - Status: ${flowStatus.status}`);

      // 2. Buscar el pago en la BD
      const payment = await this.prisma.payment.findFirst({
        where: { reference: token },
        include: {
          expense: true,
        },
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      // 3. Verificar que el pago pertenece al usuario autenticado
      if (payment.userId !== userId) {
        throw new Error('No tienes permisos para confirmar este pago');
      }

      // 4. Verificar si el pago ya fue procesado (idempotencia)
      if (payment.status === 'PAID') {
        this.logger.log(`✅ Payment already processed: ${payment.id}`);
        return {
          success: true,
          message: 'Pago ya confirmado anteriormente',
          paymentId: payment.id,
          paymentStatus: 'PAID',
          expenseStatus: payment.expense.status,
        };
      }

      // 5. Solo actualizar si el estado en Flow es PAID (2)
      if (flowStatus.status === 2) {
        // Actualizar Payment a PAID
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID' as any,
            paymentDate: new Date(),
          },
        });

        // Actualizar Expense a PAID
        await this.prisma.expense.update({
          where: { id: payment.expenseId },
          data: {
            status: 'PAID',
          },
        });

        this.logger.log(`✅ Payment ${payment.id} and Expense ${payment.expenseId} marked as PAID`);

        return {
          success: true,
          message: 'Pago confirmado exitosamente',
          paymentId: payment.id,
          paymentStatus: 'PAID',
          expenseStatus: 'PAID',
          flowStatus: flowStatus.status,
        };
      } else if (flowStatus.status === 3 || flowStatus.status === 4) {
        // Rechazado o Anulado
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED' as any,
          },
        });

        this.logger.log(`❌ Payment ${payment.id} marked as FAILED`);
        throw new Error('El pago fue rechazado por Flow');
      } else {
        // Pendiente
        throw new Error('El pago aún está pendiente en Flow');
      }
    } catch (error: any) {
      this.logger.error(
        `❌ Error confirming payment manually: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * GET /payments/status?token=...
   * Consulta el estado de un pago
   */
  @Get('status')
  @ApiOperation({ summary: 'Consultar estado de un pago' })
  @ApiResponse({
    status: 200,
    description: 'Estado del pago obtenido exitosamente',
  })
  async getPaymentStatus(@Query('token') token: string) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      // 1. Consultar estado en Flow
      const flowStatus = await this.flowService.getOrderStatus(token);

      // 2. Buscar en la BD local (opcional)
      const payment = await this.prisma.payment.findFirst({
        where: { reference: token },
        include: {
          expense: true,
        },
      });

      // 3. Mapear status de Flow a texto
      const statusText =
        {
          1: 'Pendiente',
          2: 'Pagado',
          3: 'Rechazado',
          4: 'Anulado',
        }[flowStatus.status] || 'Desconocido';

      // 4. Construir respuesta con la estructura esperada por el frontend
      return {
        success: true,
        flow: {
          status: flowStatus.status,
          statusText,
          flowOrder: flowStatus.flowOrder.toString(),
          commerceOrder: flowStatus.commerceOrder,
          amount: flowStatus.amount,
        },
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              paymentDate: payment.paymentDate?.toISOString() || null,
              expense: {
                id: payment.expense.id,
                concept: payment.expense.concept,
                amount: payment.expense.amount.toNumber(),
                status: payment.expense.status,
              },
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
}
