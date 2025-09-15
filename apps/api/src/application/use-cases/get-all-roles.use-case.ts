import { Injectable, Inject } from '@nestjs/common';
import { Role } from '../../domain/entities/role.entity';
import { RoleRepository } from '../../domain/repositories/role.repository.interface';

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(): Promise<Role[]> {
    return await this.roleRepository.findAll();
  }
}
