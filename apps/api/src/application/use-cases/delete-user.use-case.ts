import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.delete(id);
  }
}
