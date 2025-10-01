import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

@UseGuards(JwtAuthGuard)
@Controller('common-expenses')
export class CommonExpensesController {
  constructor(private readonly commonExpensesService: CommonExpensesService) {}

  @Post()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createCommonExpenseDto: CreateCommonExpenseDto,
  ): Promise<CommonExpenseResponseDto> {
    return this.commonExpensesService.createCommonExpense(user, createCommonExpenseDto);
  }

  @Get()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('communityId') communityId: string,
  ): Promise<CommonExpenseSummaryDto[]> {
    return this.commonExpensesService.getCommonExpenses(user, communityId);
  }

  @Get(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<CommonExpenseResponseDto> {
    return this.commonExpensesService.getCommonExpenseById(user, id);
  }
}
