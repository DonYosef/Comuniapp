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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Permission } from '../domain/entities/role.entity';

import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, CreateCommonSpaceDto } from './dto/create-community.dto';

@Controller('communities')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  create(@Body() createCommunityDto: CreateCommunityDto, @Request() req) {
    return this.communitiesService.createCommunity(createCommunityDto, req.user.id);
  }

  @Get()
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  findAll(@Request() req) {
    return this.communitiesService.getCommunitiesByUser(req.user.id);
  }

  @Get('organization/:organizationId')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  getCommunitiesByOrganization(@Param('organizationId') organizationId: string) {
    return this.communitiesService.getCommunitiesByOrganization(organizationId);
  }

  @Get('my-community')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  async getMyCommunity(@Request() req) {
    console.log('🔍 [CommunitiesController] getMyCommunity - userId:', req.user.id);
    console.log(
      '🔍 [CommunitiesController] user roles:',
      req.user.roles?.map((r: any) => r.name),
    );

    return this.communitiesService.getMyCommunity(req.user.id);
  }

  @Get('my-units')
  @RequirePermission(Permission.VIEW_OWN_UNIT)
  async getMyUnits(@Request() req) {
    console.log('🔍 [CommunitiesController] getMyUnits - userId:', req.user.id);
    console.log(
      '🔍 [CommunitiesController] user roles:',
      req.user.roles?.map((r: any) => r.name),
    );

    return this.communitiesService.getMyUnits(req.user.id);
  }

  @Get(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  findOne(@Param('id') id: string, @Request() req) {
    return this.communitiesService.getCommunityById(id, req.user.id);
  }

  @Patch(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  update(
    @Param('id') id: string,
    @Body() updateCommunityDto: Partial<CreateCommunityDto>,
    @Request() req,
  ) {
    return this.communitiesService.updateCommunity(id, updateCommunityDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  remove(@Param('id') id: string, @Request() req) {
    console.log('🎯 [CONTROLLER] DELETE /communities/:id recibido:', {
      communityId: id,
      userId: req.user?.id,
      userEmail: req.user?.email,
      timestamp: new Date().toISOString(),
      headers: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'No auth header',
        userAgent: req.headers['user-agent'],
      },
    });

    return this.communitiesService.deleteCommunity(id, req.user.id);
  }

  // Endpoints para gestión de espacios comunes
  @Post(':id/common-spaces')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  addCommonSpace(
    @Param('id') communityId: string,
    @Body() spaceData: CreateCommonSpaceDto,
    @Request() req,
  ) {
    return this.communitiesService.addCommonSpace(communityId, spaceData, req.user.id);
  }

  @Delete('common-spaces/:spaceId')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  removeCommonSpace(@Param('spaceId') spaceId: string, @Request() req) {
    return this.communitiesService.removeCommonSpace(spaceId, req.user.id);
  }

  // Endpoints para gestión de unidades
  @Get(':id/units')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  getCommunityUnits(@Param('id') communityId: string, @Request() req) {
    return this.communitiesService.getCommunityUnits(communityId, req.user.id);
  }

  @Post(':id/units')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  addUnit(
    @Param('id') communityId: string,
    @Body() unitData: { number: string; floor?: string; type?: string },
    @Request() req,
  ) {
    return this.communitiesService.addUnit(communityId, unitData, req.user.id);
  }

  @Delete('units/:unitId')
  @RequirePermission(Permission.MANAGE_COMMUNITY)
  removeUnit(@Param('unitId') unitId: string, @Request() req) {
    return this.communitiesService.removeUnit(unitId, req.user.id);
  }
}
