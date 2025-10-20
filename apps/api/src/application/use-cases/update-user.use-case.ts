import { Injectable, NotFoundException, Inject } from '@nestjs/common';

import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear una nueva instancia del usuario con los datos actualizados
    const updatedUser = new User(
      existingUser.id,
      updateUserDto.email ?? existingUser.email,
      updateUserDto.name ?? existingUser.name,
      existingUser.passwordHash, // No permitir actualizar la contraseña desde aquí
      updateUserDto.status ?? existingUser.status,
      existingUser.organizationId,
      updateUserDto.phone ?? existingUser.phone,
      existingUser.createdAt,
      new Date(), // updatedAt
    );

    const savedUser = await this.userRepository.update(updatedUser);

    // Manejar asignación de unidad si se proporciona
    if (updateUserDto.unitId) {
      console.log('🔍 [UpdateUserUseCase] Asignando unidad:', updateUserDto.unitId);
      try {
        // Primero eliminar las unidades existentes del usuario
        await this.userRepository.removeUserUnits(id);
        // Luego asignar la nueva unidad
        await this.userRepository.assignUnit(id, updateUserDto.unitId);
        console.log('✅ [UpdateUserUseCase] Unidad asignada correctamente');
      } catch (error) {
        console.error('❌ [UpdateUserUseCase] Error asignando unidad:', error);
      }
    }

    return savedUser;
  }
}
