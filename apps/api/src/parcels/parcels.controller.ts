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
import { ParcelsService } from './parcels.service';
import { UnitsService } from './units.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelsController {
  constructor(
    private readonly parcelsService: ParcelsService,
    private readonly unitsService: UnitsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  create(@Body() createParcelDto: CreateParcelDto, @Request() req) {
    return this.parcelsService.create(createParcelDto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  findAll(@Request() req, @Query('unitId') unitId?: string) {
    return this.parcelsService.findAll(req.user.id, unitId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  findOne(@Param('id') id: string, @Request() req) {
    return this.parcelsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN)
  update(@Param('id') id: string, @Body() updateParcelDto: UpdateParcelDto, @Request() req) {
    return this.parcelsService.update(id, updateParcelDto, req.user.id);
  }

  @Patch(':id/mark-retrieved')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  markAsRetrieved(@Param('id') id: string, @Request() req) {
    return this.parcelsService.markAsRetrieved(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.parcelsService.remove(id, req.user.id);
  }

  @Get('units/available')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.COMMUNITY_ADMIN, RoleName.RESIDENT)
  getAvailableUnits(@Request() req, @Query('communityId') communityId?: string) {
    if (communityId) {
      return this.unitsService.getUnitsByCommunity(communityId);
    }
    return this.unitsService.getUnitsByUser(req.user.id);
  }
}
