import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthorizationService } from '../auth/services/authorization.service';
import { RoleName as DomainRoleName } from '../domain/entities/role.entity';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authorizationService: AuthorizationService,
  ) {}

  async findAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    return this.prisma.user.findMany({
      where,
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: {
              include: { community: true },
            },
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto, createdByUserId: string) {
    console.log(
      '🔍 [UsersService] create - Datos recibidos:',
      JSON.stringify(createUserDto, null, 2),
    );
    console.log('🔍 [UsersService] create - createdByUserId:', createdByUserId);

    // Escribir logs a archivo para debug
    const fs = require('fs');
    const logData = `
=== DEBUG LOG ${new Date().toISOString()} ===
Datos recibidos: ${JSON.stringify(createUserDto, null, 2)}
CreatedByUserId: ${createdByUserId}
Phone: ${createUserDto.phone} (tipo: ${typeof createUserDto.phone})
OrganizationId: ${createUserDto.organizationId} (tipo: ${typeof createUserDto.organizationId})
===========================
`;
    fs.appendFileSync('debug-user-creation.log', logData);

    const { password, roleName, unitId, ...userData } = createUserDto;

    // Verificar permisos para crear usuario
    if (userData.organizationId) {
      console.log(
        '🔍 [UsersService] Verificando permisos para organizationId:',
        userData.organizationId,
      );
      const canCreate = await this.authorizationService.canCreateUserInOrganization(
        createdByUserId,
        userData.organizationId,
      );

      if (!canCreate) {
        console.log('❌ [UsersService] Sin permisos para crear usuario en organización');
        throw new ForbiddenException('No tienes permisos para crear usuarios en esta organización');
      }
      console.log('✅ [UsersService] Permisos verificados correctamente');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    console.log('✅ [UsersService] Password hasheado correctamente');

    // Crear usuario
    const userDataToCreate: any = {
      ...userData,
      passwordHash,
    };

    console.log(
      '🔍 [UsersService] Datos para crear usuario:',
      JSON.stringify(userDataToCreate, null, 2),
    );

    // Logging detallado de cada campo antes de crear
    console.log('📊 [UsersService] Análisis detallado de campos:');
    console.log('- email:', userDataToCreate.email, '(tipo:', typeof userDataToCreate.email, ')');
    console.log('- name:', userDataToCreate.name, '(tipo:', typeof userDataToCreate.name, ')');
    console.log('- phone:', userDataToCreate.phone, '(tipo:', typeof userDataToCreate.phone, ')');
    console.log(
      '- organizationId:',
      userDataToCreate.organizationId,
      '(tipo:',
      typeof userDataToCreate.organizationId,
      ')',
    );
    console.log(
      '- passwordHash:',
      userDataToCreate.passwordHash ? '[PRESENTE]' : '[AUSENTE]',
      '(tipo:',
      typeof userDataToCreate.passwordHash,
      ')',
    );
    console.log(
      '- status:',
      userDataToCreate.status,
      '(tipo:',
      typeof userDataToCreate.status,
      ')',
    );

    // Verificar valores nulos/undefined específicamente
    console.log('🔍 [UsersService] Verificación de valores null/undefined:');
    console.log('- phone === null:', userDataToCreate.phone === null);
    console.log('- phone === undefined:', userDataToCreate.phone === undefined);
    console.log('- phone === "":', userDataToCreate.phone === '');
    console.log('- organizationId === null:', userDataToCreate.organizationId === null);
    console.log('- organizationId === undefined:', userDataToCreate.organizationId === undefined);
    console.log('- organizationId === "":', userDataToCreate.organizationId === '');

    const user = await this.prisma.user.create({
      data: userDataToCreate,
    });

    console.log('✅ [UsersService] Usuario creado con ID:', user.id);
    console.log('📊 [UsersService] Usuario creado - campos guardados:');
    console.log('- email:', user.email);
    console.log('- name:', user.name);
    console.log('- phone:', user.phone, '(tipo:', typeof user.phone, ')');
    console.log(
      '- organizationId:',
      user.organizationId,
      '(tipo:',
      typeof user.organizationId,
      ')',
    );
    console.log('- status:', user.status);

    // Asignar rol si se especifica
    if (roleName) {
      const role = await this.prisma.role.findUnique({
        where: { name: roleName },
      });

      if (role) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    }

    // Asociar usuario con unidad si se especifica
    if (unitId) {
      console.log('🔍 [UsersService] Asociando usuario con unidad:', unitId);
      // Verificar que la unidad existe y pertenece a la organización del usuario
      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
        include: { community: true },
      });

      console.log('🔍 [UsersService] Unidad encontrada:', JSON.stringify(unit, null, 2));

      if (!unit) {
        console.log('❌ [UsersService] Unidad no encontrada');
        throw new BadRequestException('La unidad especificada no existe');
      }

      console.log(
        '🔍 [UsersService] Verificando organización - organizationId:',
        userData.organizationId,
        'unit.community.organizationId:',
        unit.community.organizationId,
      );

      if (userData.organizationId && unit.community.organizationId !== userData.organizationId) {
        console.log('❌ [UsersService] Unidad no pertenece a la organización');
        throw new ForbiddenException('La unidad no pertenece a la organización especificada');
      }

      console.log('🔍 [UsersService] Creando asociación usuario-unidad');
      await this.prisma.userUnit.create({
        data: {
          userId: user.id,
          unitId: unitId,
        },
      });
      console.log('✅ [UsersService] Asociación usuario-unidad creada');
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: {
              include: { community: true },
            },
          },
        },
      },
    });
  }

  async createCommunityUser(
    createUserDto: CreateUserDto,
    communityId: string,
    unitId: string,
    createdByUserId: string,
  ) {
    // Verificar que el creador puede gestionar usuarios de esta comunidad
    const canManage = await this.authorizationService.canManageCommunityUsers(
      createdByUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para crear usuarios en esta comunidad');
    }

    // Obtener la organización de la comunidad
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new BadRequestException('Comunidad no encontrada');
    }

    // Crear usuario con la organización de la comunidad
    const user = await this.create(
      {
        ...createUserDto,
        organizationId: community.organizationId,
      },
      createdByUserId,
    );

    // Asociar usuario a la unidad
    await this.prisma.userUnit.create({
      data: {
        userId: user.id,
        unitId: unitId,
        status: 'PENDING',
      },
    });

    return user;
  }

  async assignRole(userId: string, roleName: DomainRoleName, assignedByUserId: string) {
    // Verificar permisos
    const canManage = await this.authorizationService.canCreateUserInOrganization(
      assignedByUserId,
      null, // Super admin puede asignar roles globalmente
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para asignar roles');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName as RoleName },
    });

    if (!role) {
      throw new BadRequestException('Rol no encontrado');
    }

    return this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
      },
    });
  }

  async getUsersByCommunity(communityId: string, requestingUserId: string) {
    // Verificar permisos
    const canManage = await this.authorizationService.canManageCommunityUsers(
      requestingUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para ver usuarios de esta comunidad');
    }

    return this.prisma.user.findMany({
      where: {
        userUnits: {
          some: {
            unit: {
              communityId: communityId,
            },
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: true,
          },
        },
      },
    });
  }
}
