import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../domain/entities/role.entity';

import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @RequirePermission(Permission.VIEW_SYSTEM_METRICS)
  @ApiOperation({ summary: 'Obtener métricas del sistema' })
  @ApiResponse({ status: 200, description: 'Métricas del sistema' })
  getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('health')
  @RequirePermission(Permission.VIEW_SYSTEM_METRICS)
  @ApiOperation({ summary: 'Obtener estado de salud del sistema' })
  @ApiResponse({ status: 200, description: 'Estado de salud del sistema' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('organizations/:id')
  @RequirePermission(Permission.MANAGE_ALL_ORGANIZATIONS)
  @ApiOperation({ summary: 'Obtener detalles de una organización' })
  @ApiResponse({ status: 200, description: 'Detalles de la organización' })
  getOrganizationDetails(@Param('id') id: string) {
    return this.adminService.getOrganizationDetails(id);
  }
}
