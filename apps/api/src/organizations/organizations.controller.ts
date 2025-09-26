import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanType } from '../domain/entities/organization.entity';
import { Permission } from '../domain/entities/role.entity';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Crear una nueva organización' })
  @ApiResponse({ status: 201, description: 'Organización creada exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  create(@Body() createOrganizationDto: CreateOrganizationDto, @Request() req) {
    return this.organizationsService.create(createOrganizationDto, req.user.id);
  }

  @Get()
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Obtener todas las organizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de organizaciones' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Obtener una organización por ID' })
  @ApiResponse({ status: 200, description: 'Organización encontrada' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/stats')
  @RequirePermission(Permission.VIEW_SYSTEM_METRICS)
  @ApiOperation({ summary: 'Obtener estadísticas de una organización' })
  @ApiResponse({ status: 200, description: 'Estadísticas de la organización' })
  getStats(@Param('id') id: string) {
    return this.organizationsService.getOrganizationStats(id);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Actualizar una organización' })
  @ApiResponse({ status: 200, description: 'Organización actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Request() req,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, req.user.id);
  }

  @Patch(':id/upgrade-plan')
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Actualizar plan de una organización' })
  @ApiResponse({ status: 200, description: 'Plan actualizado exitosamente' })
  upgradePlan(@Param('id') id: string, @Body() body: { plan: PlanType }, @Request() req) {
    return this.organizationsService.upgradePlan(id, body.plan, req.user.id);
  }

  @Delete(':id')
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Eliminar una organización' })
  @ApiResponse({ status: 200, description: 'Organización eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.organizationsService.remove(id, req.user.id);
  }
}
