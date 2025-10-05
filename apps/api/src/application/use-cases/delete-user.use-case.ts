import { Injectable, NotFoundException, Inject } from '@nestjs/common';

import { UserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Eliminar directamente - Prisma manejará el error si no existe
    // Esto elimina una query innecesaria y mejora el rendimiento
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      // Si el error es porque el usuario no existe, lanzar NotFoundException
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }
}
