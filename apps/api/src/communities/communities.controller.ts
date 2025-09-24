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
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, CreateCommonSpaceDto } from './dto/create-community.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto, @Request() req) {
    return this.communitiesService.createCommunity(createCommunityDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.communitiesService.getCommunitiesByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.communitiesService.getCommunityById(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommunityDto: Partial<CreateCommunityDto>,
    @Request() req,
  ) {
    return this.communitiesService.updateCommunity(id, updateCommunityDto, req.user.id);
  }

  @Delete(':id')
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
  addCommonSpace(
    @Param('id') communityId: string,
    @Body() spaceData: CreateCommonSpaceDto,
    @Request() req,
  ) {
    return this.communitiesService.addCommonSpace(communityId, spaceData, req.user.id);
  }

  @Delete('common-spaces/:spaceId')
  removeCommonSpace(@Param('spaceId') spaceId: string, @Request() req) {
    return this.communitiesService.removeCommonSpace(spaceId, req.user.id);
  }

  // Endpoints para gestión de unidades
  @Get(':id/units')
  getCommunityUnits(@Param('id') communityId: string, @Request() req) {
    return this.communitiesService.getCommunityUnits(communityId, req.user.id);
  }

  @Post(':id/units')
  addUnit(
    @Param('id') communityId: string,
    @Body() unitData: { number: string; floor?: string; type?: string },
    @Request() req,
  ) {
    return this.communitiesService.addUnit(communityId, unitData, req.user.id);
  }

  @Delete('units/:unitId')
  removeUnit(@Param('unitId') unitId: string, @Request() req) {
    return this.communitiesService.removeUnit(unitId, req.user.id);
  }
}
