import { Controller, Get, Post, Body, Request, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Permission } from '../domain/entities/role.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @Post()
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Post('community/:communityId/unit/:unitId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Crear usuario en comunidad específica' })
  @ApiResponse({ status: 201, description: 'Usuario creado en comunidad exitosamente' })
  createCommunityUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.usersService.createCommunityUser(createUserDto, communityId, unitId, req.user.id);
  }

  @Get('community/:communityId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Obtener usuarios de una comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios de la comunidad' })
  getUsersByCommunity(@Param('communityId') communityId: string, @Request() req) {
    return this.usersService.getUsersByCommunity(communityId, req.user.id);
  }
}
