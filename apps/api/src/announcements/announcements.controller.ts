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
  Query,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityAdminGuard } from '../auth/guards/community-admin.guard';

@Controller('announcements')
@UseGuards(JwtAuthGuard, CommunityAdminGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req) {
    return this.announcementsService.create(createAnnouncementDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.announcementsService.findAllByUser(req.user.id);
  }

  @Get('community/:communityId')
  findAllByCommunity(@Param('communityId') communityId: string, @Request() req) {
    return this.announcementsService.findAllByCommunity(communityId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.announcementsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @Request() req,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.announcementsService.remove(id, req.user.id);
  }
}
