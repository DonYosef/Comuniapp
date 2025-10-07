import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommunityIncomeService } from './community-income.service';
import { CreateCommunityIncomeDto } from './dto/create-community-income.dto';
import { CommunityIncomeResponseDto } from './dto/community-income-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Permission } from '../domain/entities/role.entity';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('community-income')
export class CommunityIncomeController {
  constructor(private readonly communityIncomeService: CommunityIncomeService) {}

  @Post()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES)
  async create(
    @CurrentUser() user: UserPayload,
    @Body() createCommunityIncomeDto: CreateCommunityIncomeDto,
  ): Promise<CommunityIncomeResponseDto> {
    return this.communityIncomeService.createCommunityIncome(user, createCommunityIncomeDto);
  }

  @Get()
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('communityId') communityId: string,
  ): Promise<CommunityIncomeResponseDto[]> {
    return this.communityIncomeService.getCommunityIncomes(user, communityId);
  }

  @Get(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY_EXPENSES, Permission.VIEW_OWN_EXPENSES)
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ): Promise<CommunityIncomeResponseDto> {
    return this.communityIncomeService.getCommunityIncomeById(user, id);
  }
}
