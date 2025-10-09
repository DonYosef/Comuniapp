import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommonExpenseDto } from './dto/create-common-expense.dto';
import {
  CommonExpenseResponseDto,
  CommonExpenseSummaryDto,
  UnitExpenseResponseDto,
} from './dto/common-expense-response.dto';
import { Permission } from '../domain/entities/role.entity';
import { ProrrateMethod } from '../types/prisma.types';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@Injectable()
export class CommonExpensesService {
  constructor(private prisma: PrismaService) {}

  async createCommonExpense(
    user: UserPayload,
    dto: CreateCommonExpenseDto,
  ): Promise<CommonExpenseResponseDto> {
    // 1. Validar permisos del usuario
    const community = await this.prisma.community.findUnique({
      where: { id: dto.communityId },
      include: {
        organization: {
          include: {
            users: {
              where: { id: user.id },
              include: {
                roles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException(`Community with ID ${dto.communityId} not found`);
    }

    const userOrgRole = community.organization.users.find((u) => u.id === user.id);
    if (!userOrgRole) {
      throw new UnauthorizedException('You are not a member of this organization.');
    }

    const hasPermission = userOrgRole.roles.some((ur) =>
      ur.role.permissions.includes(Permission.MANAGE_COMMUNITY_EXPENSES),
    );

    if (!hasPermission) {
      throw new UnauthorizedException(
        'You do not have permission to manage common expenses for this community.',
      );
    }

    // 2. Verificar si ya existe un gasto común para el período
    const existingCommonExpense = await this.prisma.communityExpense.findUnique({
      where: {
        communityId_period: {
          communityId: dto.communityId,
          period: dto.period,
        },
      },
    });

    if (existingCommonExpense) {
      throw new ConflictException(
        `A common expense for community ${dto.communityId} and period ${dto.period} already exists.`,
      );
    }

    // 3. Calcular totalAmount
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    // 4. Obtener unidades activas y sus coeficientes
    const units = await this.prisma.unit.findMany({
      where: { communityId: dto.communityId, isActive: true },
      select: { id: true, number: true, coefficient: true },
    });

    if (units.length === 0) {
      throw new ConflictException(
        'No active units found in the community to prorate expenses. Please add units to the community first.',
      );
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

    const unitExpenses: {
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

      unitExpenses.push({
        unitId: unit.id,
        unitNumber: unit.number,
        amount: prorratedAmount,
        concept: `Gastos Comunes ${dto.period}`,
        description: `Detalle: ${dto.items.map((item) => item.name).join(', ')}`,
        dueDate: dto.dueDate,
        status: 'PENDING',
      });
    }

    // 5. Crear registros en una transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      const createdCommonExpense = await prisma.communityExpense.create({
        data: {
          communityId: dto.communityId,
          period: dto.period,
          totalAmount: totalAmount,
          dueDate: dto.dueDate,
          prorrateMethod: dto.prorrateMethod,
          items: {
            createMany: {
              data: dto.items.map((item) => ({
                name: item.name,
                amount: item.amount,
                description: item.description,
                categoryId: item.categoryId, // ← AGREGAR CATEGORYID
              })),
            },
          },
        },
        include: {
          items: true,
        },
      });

      // Crear todos los gastos de unidades de una vez usando createMany
      const expenseData = unitExpenses.map((ue) => ({
        unitId: ue.unitId,
        amount: ue.amount,
        concept: ue.concept,
        description: ue.description,
        dueDate: ue.dueDate,
        status: ue.status,
        communityExpenseId: createdCommonExpense.id,
      }));

      await prisma.expense.createMany({
        data: expenseData,
      });

      // Obtener los gastos creados con sus unidades
      const createdExpenses = await prisma.expense.findMany({
        where: { communityExpenseId: createdCommonExpense.id },
        include: {
          unit: {
            select: { number: true },
          },
        },
      });

      const createdUnitExpenses: UnitExpenseResponseDto[] = createdExpenses.map((expense) => ({
        id: expense.id,
        unitId: expense.unitId,
        unitNumber: expense.unit.number,
        amount: expense.amount.toNumber(),
        concept: expense.concept,
        description: expense.description,
        dueDate: expense.dueDate,
        status: expense.status,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      }));

      return { createdCommonExpense, createdUnitExpenses };
    });

    return {
      id: result.createdCommonExpense.id,
      communityId: result.createdCommonExpense.communityId,
      communityName: community.name,
      period: result.createdCommonExpense.period,
      totalAmount: result.createdCommonExpense.totalAmount.toNumber(),
      dueDate: result.createdCommonExpense.dueDate,
      prorrateMethod: result.createdCommonExpense.prorrateMethod,
      items: result.createdCommonExpense.items.map((item) => ({
        ...item,
        amount: item.amount.toNumber(),
      })),
      unitExpenses: result.createdUnitExpenses,
      createdAt: result.createdCommonExpense.createdAt,
      updatedAt: result.createdCommonExpense.updatedAt,
    };
  }

  async getCommonExpenses(
    user: UserPayload,
    communityId: string,
  ): Promise<CommonExpenseSummaryDto[]> {
    // Validar permisos del usuario
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        organization: {
          include: {
            users: {
              where: { id: user.id },
              include: {
                roles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException(`Community with ID ${communityId} not found`);
    }

    const userOrgRole = community.organization.users.find((u) => u.id === user.id);
    if (!userOrgRole) {
      throw new UnauthorizedException('You are not a member of this organization.');
    }

    const hasPermission = userOrgRole.roles.some(
      (ur) =>
        ur.role.permissions.includes(Permission.MANAGE_COMMUNITY_EXPENSES) ||
        ur.role.permissions.includes(Permission.VIEW_OWN_EXPENSES),
    );

    if (!hasPermission) {
      throw new UnauthorizedException(
        'You do not have permission to view common expenses for this community.',
      );
    }

    const commonExpenses = await this.prisma.communityExpense.findMany({
      where: { communityId },
      orderBy: { period: 'desc' },
      include: {
        items: true, // ← AGREGAR ITEMS
        expenses: {
          select: { status: true },
        },
        _count: {
          select: { expenses: true },
        },
      },
    });

    return commonExpenses.map((ce) => ({
      id: ce.id,
      communityId: ce.communityId,
      communityName: community.name,
      period: ce.period,
      totalAmount: ce.totalAmount.toNumber(),
      dueDate: ce.dueDate,
      totalUnits: ce._count.expenses,
      paidUnits: ce.expenses.filter((e) => e.status === 'PAID').length,
      pendingUnits: ce.expenses.filter((e) => e.status === 'PENDING').length,
      overdueUnits: ce.expenses.filter((e) => e.status === 'OVERDUE').length,
      createdAt: ce.createdAt,
      items: ce.items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount.toNumber(),
        description: item.description,
        categoryId: item.categoryId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })), // ← AGREGAR MAPEO DE ITEMS
    }));
  }

  async getCommonExpenseById(user: UserPayload, id: string): Promise<CommonExpenseResponseDto> {
    const commonExpense = await this.prisma.communityExpense.findUnique({
      where: { id },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                users: {
                  where: { id: user.id },
                  include: {
                    roles: {
                      include: {
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        items: true,
        expenses: {
          include: {
            unit: {
              select: { number: true },
            },
          },
        },
      },
    });

    if (!commonExpense) {
      throw new NotFoundException(`Common expense with ID ${id} not found`);
    }

    const userOrgRole = commonExpense.community.organization.users.find((u) => u.id === user.id);

    if (!userOrgRole) {
      throw new UnauthorizedException('You are not a member of this organization.');
    }

    const hasPermission = userOrgRole.roles.some(
      (ur) =>
        ur.role.permissions.includes(Permission.MANAGE_COMMUNITY_EXPENSES) ||
        ur.role.permissions.includes(Permission.VIEW_OWN_EXPENSES),
    );

    if (!hasPermission) {
      throw new UnauthorizedException('You do not have permission to view this common expense.');
    }

    return {
      id: commonExpense.id,
      communityId: commonExpense.communityId,
      communityName: commonExpense.community.name,
      period: commonExpense.period,
      totalAmount: commonExpense.totalAmount.toNumber(),
      dueDate: commonExpense.dueDate,
      prorrateMethod: commonExpense.prorrateMethod,
      items: commonExpense.items.map((item) => ({
        ...item,
        amount: item.amount.toNumber(),
      })),
      unitExpenses: commonExpense.expenses.map((expense) => ({
        id: expense.id,
        unitId: expense.unitId,
        unitNumber: expense.unit.number,
        amount: expense.amount.toNumber(),
        concept: expense.concept,
        description: expense.description,
        dueDate: expense.dueDate,
        status: expense.status,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })),
      createdAt: commonExpense.createdAt,
      updatedAt: commonExpense.updatedAt,
    };
  }

  async updateCommonExpense(
    user: UserPayload,
    id: string,
    dto: Partial<CreateCommonExpenseDto>,
  ): Promise<CommonExpenseResponseDto> {
    // 1. Verificar que el gasto común existe y el usuario tiene permisos
    const existingExpense = await this.prisma.communityExpense.findUnique({
      where: { id },
      include: {
        community: {
          include: {
            organization: {
              include: {
                users: {
                  where: { id: user.id },
                  include: {
                    roles: {
                      include: {
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingExpense) {
      throw new NotFoundException(`Common expense with ID ${id} not found`);
    }

    const userOrgRole = existingExpense.community.organization.users.find((u) => u.id === user.id);

    if (!userOrgRole) {
      throw new UnauthorizedException('You are not a member of this organization.');
    }

    const hasPermission = userOrgRole.roles.some((ur) =>
      ur.role.permissions.includes(Permission.MANAGE_COMMUNITY_EXPENSES),
    );

    if (!hasPermission) {
      throw new UnauthorizedException('You do not have permission to update this common expense.');
    }

    // 2. Actualizar el gasto común
    const updateData: any = {};

    if (dto.period) updateData.period = dto.period;
    if (dto.dueDate) updateData.dueDate = dto.dueDate;
    if (dto.prorrateMethod) updateData.prorrateMethod = dto.prorrateMethod;

    // Si se proporcionan items, actualizarlos
    if (dto.items) {
      // Eliminar items existentes
      await this.prisma.communityExpenseItem.deleteMany({
        where: { communityExpenseId: id },
      });

      // Crear nuevos items
      const items = dto.items.map((item) => ({
        name: item.name,
        amount: item.amount,
        description: item.description,
        categoryId: item.categoryId, // ← AGREGAR CATEGORYID
        communityExpenseId: id,
      }));

      await this.prisma.communityExpenseItem.createMany({
        data: items,
      });

      // Recalcular el total
      const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);
      updateData.totalAmount = totalAmount;
    }

    // 3. Actualizar el gasto común
    const updatedExpense = await this.prisma.communityExpense.update({
      where: { id },
      data: updateData,
      include: {
        community: {
          select: { name: true },
        },
        items: true,
        expenses: {
          include: {
            unit: {
              select: { number: true },
            },
          },
        },
      },
    });

    // 4. Retornar la respuesta
    return {
      id: updatedExpense.id,
      communityId: updatedExpense.communityId,
      communityName: updatedExpense.community.name,
      period: updatedExpense.period,
      totalAmount: updatedExpense.totalAmount.toNumber(),
      dueDate: updatedExpense.dueDate,
      prorrateMethod: updatedExpense.prorrateMethod,
      items: updatedExpense.items.map((item) => ({
        ...item,
        amount: item.amount.toNumber(),
      })),
      unitExpenses: updatedExpense.expenses.map((expense) => ({
        id: expense.id,
        unitId: expense.unitId,
        unitNumber: expense.unit.number,
        amount: expense.amount.toNumber(),
        concept: expense.concept,
        description: expense.description,
        dueDate: expense.dueDate,
        status: expense.status,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })),
      createdAt: updatedExpense.createdAt,
      updatedAt: updatedExpense.updatedAt,
    };
  }
}
