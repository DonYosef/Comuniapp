import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  async createCategory(
    user: UserPayload,
    dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, dto.communityId);

    // Verificar que no exista una categoría con el mismo nombre en la comunidad
    const existingCategory = await this.prisma.expenseCategory.findFirst({
      where: {
        communityId: dto.communityId,
        name: dto.name,
        isActive: true,
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Ya existe una categoría con el nombre "${dto.name}" en esta comunidad.`,
      );
    }

    const category = await this.prisma.expenseCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        communityId: dto.communityId,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToResponseDto(category);
  }

  async getCategoriesByCommunity(
    user: UserPayload,
    communityId: string,
  ): Promise<ExpenseCategoryResponseDto[]> {
    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, communityId);

    const categories = await this.prisma.expenseCategory.findMany({
      where: {
        communityId,
        isActive: true,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            expenseItems: true,
            incomeItems: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => this.mapToResponseDto(category));
  }

  async getCategoryById(
    user: UserPayload,
    categoryId: string,
  ): Promise<ExpenseCategoryResponseDto> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            expenseItems: true,
            incomeItems: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, category.communityId);

    return this.mapToResponseDto(category);
  }

  async updateCategory(
    user: UserPayload,
    categoryId: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, category.communityId);

    // Si se está cambiando el nombre, verificar que no exista otra categoría con el mismo nombre
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.prisma.expenseCategory.findFirst({
        where: {
          communityId: category.communityId,
          name: dto.name,
          isActive: true,
          id: {
            not: categoryId,
          },
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.name}" en esta comunidad.`,
        );
      }
    }

    const updatedCategory = await this.prisma.expenseCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            expenseItems: true,
            incomeItems: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updatedCategory);
  }

  async deleteCategory(user: UserPayload, categoryId: string): Promise<void> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            expenses: true,
            expenseItems: true,
            incomeItems: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, category.communityId);

    // Verificar que no tenga gastos asociados
    const totalUsage =
      category._count.expenses + category._count.expenseItems + category._count.incomeItems;
    if (totalUsage > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene gastos o ingresos asociados. Desactívala en su lugar.',
      );
    }

    await this.prisma.expenseCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async deactivateCategory(
    user: UserPayload,
    categoryId: string,
  ): Promise<ExpenseCategoryResponseDto> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    // Verificar que el usuario tenga acceso a la comunidad
    await this.verifyCommunityAccess(user, category.communityId);

    const updatedCategory = await this.prisma.expenseCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        isActive: false,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            expenseItems: true,
            incomeItems: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updatedCategory);
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
          {
            units: {
              some: {
                userUnits: {
                  some: {
                    user: {
                      id: user.id,
                    },
                    status: 'CONFIRMED',
                  },
                },
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

  private mapToResponseDto(category: any): ExpenseCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      communityId: category.communityId,
      communityName: category.community?.name,
      usageCount: category._count
        ? category._count.expenses + category._count.expenseItems + category._count.incomeItems
        : 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
