import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('visitors')
@UseGuards(JwtAuthGuard)
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  create(@Body() createVisitorDto: CreateVisitorDto, @Request() req) {
    return this.visitorsService.create(createVisitorDto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  findAll(@Request() req, @Query('unitId') unitId?: string) {
    return this.visitorsService.findAll(req.user.id, unitId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  findOne(@Param('id') id: string, @Request() req) {
    return this.visitorsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN)
  update(@Param('id') id: string, @Body() updateVisitorDto: UpdateVisitorDto, @Request() req) {
    return this.visitorsService.update(id, updateVisitorDto, req.user.id);
  }

  @Patch(':id/mark-arrived')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  markAsArrived(@Param('id') id: string, @Request() req) {
    return this.visitorsService.markAsArrived(id, req.user.id);
  }

  @Patch(':id/mark-completed')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  markAsCompleted(@Param('id') id: string, @Request() req) {
    return this.visitorsService.markAsCompleted(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.visitorsService.remove(id, req.user.id);
  }
}
