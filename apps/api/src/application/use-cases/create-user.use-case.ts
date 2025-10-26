import { Injectable, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { User, UserStatus } from '../../domain/entities/user.entity';
import { RoleRepository } from '../../domain/repositories/role.repository.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(createUserDto: CreateUserDto, createdByUserId?: string): Promise<User> {
    const {
      email,
      name,
      password,
      status = UserStatus.ACTIVE,
      organizationId,
      phone,
      roleName,
      unitId,
    } = createUserDto;

    console.log('🔍 [CreateUserUseCase] Datos recibidos:', JSON.stringify(createUserDto, null, 2));
    console.log('🔍 [CreateUserUseCase] roleName:', roleName);

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const user = User.create(
      email,
      name,
      passwordHash,
      organizationId || null,
      status,
      phone || null,
    );

    // Guardar en el repositorio
    const savedUser = await this.userRepository.create(user);
    console.log('✅ [CreateUserUseCase] Usuario creado:', savedUser.id);

    // Asignar rol si se especifica
    const roleToAssign = roleName || 'RESIDENT';
    console.log('🔍 [CreateUserUseCase] Asignando rol:', roleToAssign);

    try {
      const role = await this.roleRepository.findByName(roleToAssign);
      if (role) {
        await this.userRepository.assignRole(savedUser.id, role.id);
        console.log('✅ [CreateUserUseCase] Rol asignado:', role.name);
      } else {
        console.log('❌ [CreateUserUseCase] Rol no encontrado:', roleToAssign);
        // Intentar con rol RESIDENT como fallback
        const fallbackRole = await this.roleRepository.findByName('RESIDENT');
        if (fallbackRole) {
          await this.userRepository.assignRole(savedUser.id, fallbackRole.id);
          console.log('✅ [CreateUserUseCase] Rol de fallback asignado: RESIDENT');
        }
      }
    } catch (error) {
      console.error('❌ [CreateUserUseCase] Error asignando rol:', error);
    }

    // Asociar usuario con unidad si se especifica
    if (unitId) {
      console.log('🔍 [CreateUserUseCase] Asociando usuario con unidad:', unitId);
      try {
        await this.userRepository.assignUnit(savedUser.id, unitId);
        console.log('✅ [CreateUserUseCase] Unidad asignada');
      } catch (error) {
        console.error('❌ [CreateUserUseCase] Error asignando unidad:', error);
      }
    }

    return savedUser;
  }
}
