import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../domain/entities/role.entity';

import { ResidentsService } from './residents.service';

@ApiTags('residents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get('my-units')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Obtener mis unidades' })
  @ApiResponse({ status: 200, description: 'Lista de unidades del usuario' })
  getMyUnits(@Request() req) {
    return this.residentsService.getMyUnits(req.user.id);
  }

  @Get('my-expenses')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Obtener mis gastos' })
  @ApiResponse({ status: 200, description: 'Lista de gastos del usuario' })
  getMyExpenses(@Request() req) {
    return this.residentsService.getMyExpenses(req.user.id);
  }

  @Get('my-payments')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Obtener mis pagos' })
  @ApiResponse({ status: 200, description: 'Lista de pagos del usuario' })
  getMyPayments(@Request() req) {
    return this.residentsService.getMyPayments(req.user.id);
  }

  @Get('my-visitors')
  @RequirePermission(Permission.MANAGE_OWN_VISITORS)
  @ApiOperation({ summary: 'Obtener mis visitantes' })
  @ApiResponse({ status: 200, description: 'Lista de visitantes del usuario' })
  getMyVisitors(@Request() req) {
    return this.residentsService.getMyVisitors(req.user.id);
  }

  @Post('visitors')
  @RequirePermission(Permission.MANAGE_OWN_VISITORS)
  @ApiOperation({ summary: 'Registrar visitante' })
  @ApiResponse({ status: 201, description: 'Visitante registrado exitosamente' })
  createVisitor(@Body() visitorData: any, @Request() req) {
    return this.residentsService.createVisitor(visitorData, req.user.id);
  }

  @Get('my-incidents')
  @RequirePermission(Permission.CREATE_INCIDENTS)
  @ApiOperation({ summary: 'Obtener mis incidencias' })
  @ApiResponse({ status: 200, description: 'Lista de incidencias del usuario' })
  getMyIncidents(@Request() req) {
    return this.residentsService.getMyIncidents(req.user.id);
  }

  @Post('incidents')
  @RequirePermission(Permission.CREATE_INCIDENTS)
  @ApiOperation({ summary: 'Crear incidencia' })
  @ApiResponse({ status: 201, description: 'Incidencia creada exitosamente' })
  createIncident(@Body() incidentData: any, @Request() req) {
    return this.residentsService.createIncident(incidentData, req.user.id);
  }

  @Get('my-reservations')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Obtener mis reservas' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del usuario' })
  getMyReservations(@Request() req) {
    return this.residentsService.getMyReservations(req.user.id);
  }

  @Post('reservations')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Crear reserva' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  createReservation(@Body() reservationData: any, @Request() req) {
    return this.residentsService.createReservation(reservationData, req.user.id);
  }

  @Get('common-spaces')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  @ApiOperation({ summary: 'Obtener espacios comunes de mis comunidades' })
  @ApiResponse({ status: 200, description: 'Lista de espacios comunes' })
  getMyCommonSpaces(@Request() req) {
    return this.residentsService.getMyCommonSpaces(req.user.id);
  }

  @Get('announcements')
  @RequirePermission(Permission.VIEW_ANNOUNCEMENTS)
  @ApiOperation({ summary: 'Obtener anuncios de mis comunidades' })
  @ApiResponse({ status: 200, description: 'Lista de anuncios' })
  getCommunityAnnouncements(@Request() req) {
    return this.residentsService.getCommunityAnnouncements(req.user.id);
  }
}
