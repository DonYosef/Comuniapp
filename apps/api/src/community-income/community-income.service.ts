import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityIncomeDto } from './dto/create-community-income.dto';
import { CommunityIncomeResponseDto } from './dto/community-income-response.dto';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { ProrrateMethod } from '../types/prisma.types';

@Injectable()
export class CommunityIncomeService {
  constructor(private prisma: PrismaService) {}

  async createCommunityIncome(
    user: UserPayload,
    dto: CreateCommunityIncomeDto,
  ): Promise<CommunityIncomeResponseDto> {
    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, dto.communityId);

    // Verificar que no exista un ingreso para el mismo período
    const existingIncome = await this.prisma.communityIncome.findUnique({
      where: {
        communityId_period: {
          communityId: dto.communityId,
          period: dto.period,
        },
      },
    });

    if (existingIncome) {
      throw new ConflictException(
        `Ya existe un registro de ingresos para el período ${dto.period} en esta comunidad.`,
      );
    }

    // Calcular totalAmount
    const totalAmount = dto.items.reduce((sum, item) => sum + Number(item.amount), 0);

    // Obtener unidades activas y sus coeficientes
    const units = await this.prisma.unit.findMany({
      where: { communityId: dto.communityId, isActive: true },
      select: { id: true, number: true, coefficient: true },
    });

    if (units.length === 0) {
      throw new ConflictException('No active units found in the community to prorate income.');
    }

    let totalCoefficient = 0;
    if (dto.prorrateMethod === ProrrateMethod.COEFFICIENT) {
      totalCoefficient = units.reduce((sum, unit) => sum + unit.coefficient.toNumber(), 0);
      if (totalCoefficient === 0) {
        throw new ConflictException(
          'Total coefficient of active units is zero, cannot prorate by coefficient.',
        );
      }
    }

    const unitIncomes: {
      unitId: string;
      unitNumber: string;
      amount: number;
      concept: string;
      description?: string;
      dueDate: Date;
      status: 'PENDING';
    }[] = [];

    for (const unit of units) {
      let prorratedAmount: number;
      if (dto.prorrateMethod === ProrrateMethod.EQUAL) {
        prorratedAmount = totalAmount / units.length;
      } else {
        // ProrrateMethod.COEFFICIENT
        prorratedAmount = totalAmount * (unit.coefficient.toNumber() / totalCoefficient);
      }
      // Redondear a dos decimales
      prorratedAmount = parseFloat(prorratedAmount.toFixed(2));

      unitIncomes.push({
        unitId: unit.id,
        unitNumber: unit.number,
        amount: prorratedAmount,
        concept: `Ingresos Comunes ${dto.period}`,
        description: `Detalle: ${dto.items.map((item) => item.name).join(', ')}`,
        dueDate: dto.dueDate,
        status: 'PENDING',
      });
    }

    // Crear registros en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear el ingreso común
      const communityIncome = await tx.communityIncome.create({
        data: {
          communityId: dto.communityId,
          period: dto.period,
          totalAmount,
          dueDate: dto.dueDate,
          prorrateMethod: dto.prorrateMethod,
        },
      });

      // Crear los items del ingreso
      const incomeItems = await Promise.all(
        dto.items.map((item) =>
          tx.communityIncomeItem.create({
            data: {
              communityIncomeId: communityIncome.id,
              categoryId: item.categoryId,
              name: item.name,
              amount: item.amount,
              description: item.description,
            },
          }),
        ),
      );

      // Crear los ingresos individuales por unidad
      const unitIncomeRecords = await Promise.all(
        unitIncomes.map((unitIncome) =>
          tx.expense.create({
            data: {
              unitId: unitIncome.unitId,
              amount: unitIncome.amount,
              concept: unitIncome.concept,
              description: unitIncome.description,
              dueDate: unitIncome.dueDate,
              status: unitIncome.status as any,
              // No asociamos con communityExpenseId ya que es un ingreso
            },
          }),
        ),
      );

      return {
        communityIncome,
        incomeItems,
        unitIncomeRecords,
      };
    });

    // Obtener el resultado completo con relaciones
    const fullResult = await this.prisma.communityIncome.findUnique({
      where: { id: result.communityIncome.id },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(fullResult!);
  }

  async getCommunityIncomes(
    user: UserPayload,
    communityId: string,
  ): Promise<CommunityIncomeResponseDto[]> {
    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, communityId);

    const incomes = await this.prisma.communityIncome.findMany({
      where: { communityId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        period: 'desc',
      },
    });

    return incomes.map((income) => this.mapToResponseDto(income));
  }

  async getCommunityIncomeById(
    user: UserPayload,
    incomeId: string,
  ): Promise<CommunityIncomeResponseDto> {
    const income = await this.prisma.communityIncome.findUnique({
      where: { id: incomeId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!income) {
      throw new NotFoundException('Ingreso común no encontrado.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, income.communityId);

    return this.mapToResponseDto(income);
  }

  async updateCommunityIncome(
    user: UserPayload,
    incomeId: string,
    updateData: { items?: any[]; totalAmount?: number; dueDate?: string },
  ): Promise<CommunityIncomeResponseDto> {
    // Verificar que el ingreso existe
    const existingIncome = await this.prisma.communityIncome.findUnique({
      where: { id: incomeId },
      include: {
        items: true,
      },
    });

    if (!existingIncome) {
      throw new NotFoundException('Ingreso común no encontrado.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, existingIncome.communityId);

    // Si se proporcionan items, actualizar la lista
    if (updateData.items) {
      // Eliminar items existentes
      await this.prisma.communityIncomeItem.deleteMany({
        where: { communityIncomeId: incomeId },
      });

      // Crear nuevos items
      await this.prisma.communityIncomeItem.createMany({
        data: updateData.items.map((item) => ({
          communityIncomeId: incomeId,
          name: item.name,
          amount: item.amount,
          description: item.description,
          categoryId: item.categoryId,
        })),
      });

      // Recalcular totalAmount
      const totalAmount = updateData.items.reduce((sum, item) => sum + Number(item.amount), 0);
      updateData.totalAmount = totalAmount;
    }

    // Actualizar el ingreso
    const updatedIncome = await this.prisma.communityIncome.update({
      where: { id: incomeId },
      data: {
        totalAmount: updateData.totalAmount,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(updatedIncome);
  }

  async deleteIncomeItem(
    user: UserPayload,
    incomeId: string,
    itemId: string,
  ): Promise<CommunityIncomeResponseDto> {
    // Verificar que el ingreso existe
    const existingIncome = await this.prisma.communityIncome.findUnique({
      where: { id: incomeId },
      include: {
        items: true,
      },
    });

    if (!existingIncome) {
      throw new NotFoundException('Ingreso común no encontrado.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, existingIncome.communityId);

    // Verificar que el item existe
    const item = existingIncome.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException('Item de ingreso no encontrado.');
    }

    // Eliminar el item
    await this.prisma.communityIncomeItem.delete({
      where: { id: itemId },
    });

    // Recalcular totalAmount
    const remainingItems = existingIncome.items.filter((item) => item.id !== itemId);
    const newTotalAmount = remainingItems.reduce((sum, item) => sum + Number(item.amount), 0);

    // Actualizar el ingreso con el nuevo totalAmount
    const updatedIncome = await this.prisma.communityIncome.update({
      where: { id: incomeId },
      data: {
        totalAmount: newTotalAmount,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(updatedIncome);
  }

  private async verifyCommunityAccess(user: UserPayload, communityId: string): Promise<void> {
    // Verificar que el usuario tenga acceso a la comunidad
    const hasAccess = await this.prisma.community.findFirst({
      where: {
        id: communityId,
        OR: [
          { createdById: user.id },
          {
            communityAdmins: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      throw new UnauthorizedException('No tienes acceso a esta comunidad.');
    }
  }

  private mapToResponseDto(income: any): CommunityIncomeResponseDto {
    return {
      id: income.id,
      communityId: income.communityId,
      communityName: income.community?.name,
      period: income.period,
      totalAmount: Number(income.totalAmount),
      dueDate: income.dueDate,
      prorrateMethod: income.prorrateMethod,
      items: income.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        description: item.description,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };
  }
}
