import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CommonExpensesService } from './common-expenses.service';
import { CreateCommonExpenseDto } from './dto/create-common-expense.dto';
import {
  CommonExpenseResponseDto,
  CommonExpenseSummaryDto,
} from './dto/common-expense-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Permission } from '../domain/entities/role.entity';

@Controller('common-expenses')
export class CommonExpensesController {
  constructor(private readonly commonExpensesService: CommonExpensesService) {}

  @Get('test')
  async test() {
    return { message: 'Common expenses endpoint is working' };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createCommonExpenseDto: CreateCommonExpenseDto,
  ): Promise<CommonExpenseResponseDto> {
    return this.commonExpensesService.createCommonExpense(user, createCommonExpenseDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('communityId') communityId: string,
    @Query('period') period?: string,
  ): Promise<CommonExpenseSummaryDto[]> {
    return this.commonExpensesService.getCommonExpenses(user, communityId, period);
  }

  // Rutas específicas deben ir ANTES que las rutas generales
  @UseGuards(JwtAuthGuard)
  @Post(':id/prorate')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async prorrateExpense(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<CommonExpenseResponseDto> {
    console.log('📊 [Controller] Prorrateando gasto común:', { id, userId: user.id });
    return this.commonExpensesService.prorrateCommonExpense(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/prorated')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async deleteProrated(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    console.log('🗑️ [Controller] Eliminando gastos prorrateados:', { id, userId: user.id });
    return this.commonExpensesService.deleteProrratedExpenses(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/items/:itemId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async deleteItem(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<{ message: string }> {
    console.log('🗑️ [Controller] Eliminando item:', { id, itemId, userId: user.id });
    return this.commonExpensesService.deleteExpenseItem(user, id, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async delete(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    console.log('🗑️ [Controller] Eliminando gasto común completo:', { id, userId: user.id });
    return this.commonExpensesService.deleteCommonExpense(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<CommonExpenseResponseDto> {
    return this.commonExpensesService.getCommonExpenseById(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateCommonExpenseDto: Partial<CreateCommonExpenseDto>,
  ): Promise<CommonExpenseResponseDto> {
    return this.commonExpensesService.updateCommonExpense(user, id, updateCommonExpenseDto);
  }
}
