import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../domain/entities/role.entity';

import { ConciergeService } from './concierge.service';

@ApiTags('concierge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('concierge')
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Get('community/:communityId/visitors')
  @RequirePermission(Permission.MANAGE_VISITORS)
  @ApiOperation({ summary: 'Obtener visitantes de una comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de visitantes' })
  getVisitors(@Param('communityId') communityId: string, @Request() req) {
    return this.conciergeService.getVisitors(communityId, req.user.id);
  }

  @Get('community/:communityId/parcels')
  @RequirePermission(Permission.MANAGE_PARCELS)
  @ApiOperation({ summary: 'Obtener paquetes de una comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de paquetes' })
  getParcels(@Param('communityId') communityId: string, @Request() req) {
    return this.conciergeService.getParcels(communityId, req.user.id);
  }

  @Get('community/:communityId/reservations')
  @RequirePermission(Permission.MANAGE_RESERVATIONS)
  @ApiOperation({ summary: 'Obtener reservas de una comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de reservas' })
  getReservations(@Param('communityId') communityId: string, @Request() req) {
    return this.conciergeService.getReservations(communityId, req.user.id);
  }

  @Get('community/:communityId/announcements')
  @RequirePermission(Permission.VIEW_COMMUNITY_ANNOUNCEMENTS)
  @ApiOperation({ summary: 'Obtener anuncios de una comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de anuncios' })
  getAnnouncements(@Param('communityId') communityId: string, @Request() req) {
    return this.conciergeService.getAnnouncements(communityId, req.user.id);
  }

  @Patch('visitors/:visitorId/status')
  @RequirePermission(Permission.MANAGE_VISITORS)
  @ApiOperation({ summary: 'Actualizar estado de visitante' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  updateVisitorStatus(
    @Param('visitorId') visitorId: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.conciergeService.updateVisitorStatus(visitorId, body.status, req.user.id);
  }

  @Patch('parcels/:parcelId/status')
  @RequirePermission(Permission.MANAGE_PARCELS)
  @ApiOperation({ summary: 'Actualizar estado de paquete' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  updateParcelStatus(
    @Param('parcelId') parcelId: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.conciergeService.updateParcelStatus(parcelId, body.status, req.user.id);
  }
}
