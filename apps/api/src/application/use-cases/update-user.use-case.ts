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
      existingUser.createdAt,
      new Date(), // updatedAt
    );

    return await this.userRepository.update(updatedUser);
  }
}
