import { Injectable, ConflictException, Inject } from '@nestjs/common';

import { Role, RoleName } from '../../domain/entities/role.entity';
import { RoleRepository } from '../../domain/repositories/role.repository.interface';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, description, permissions } = createRoleDto;

    // Verificar si el rol ya existe
    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole) {
      throw new ConflictException('El rol con este nombre ya existe');
    }

    // Crear el rol
    const role = Role.create(name as RoleName, description || null, permissions);

    // Guardar en el repositorio
    return await this.roleRepository.create(role);
  }
}
