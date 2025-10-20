import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityAdminGuard } from '../auth/guards/community-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard, CommunityAdminGuard)
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createExpenseCategoryDto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.createCategory(user, createExpenseCategoryDto);
  }

  @Get()
  async findByCommunity(
    @CurrentUser() user: UserPayload,
    @Query('communityId') communityId: string,
    @Query('type') type?: 'EXPENSE' | 'INCOME',
  ): Promise<ExpenseCategoryResponseDto[]> {
    return this.expenseCategoriesService.getCategoriesByCommunity(user, communityId, type);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.getCategoryById(user, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.updateCategory(user, id, updateExpenseCategoryDto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserPayload, @Param('id') id: string): Promise<void> {
    return this.expenseCategoriesService.deleteCategory(user, id);
  }

  @Put(':id/deactivate')
  async deactivate(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.deactivateCategory(user, id);
  }
}
