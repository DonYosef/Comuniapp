import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(createUserDto: CreateUserDto, createdByUserId?: string): Promise<User> {
    const { email, name, password, status = UserStatus.ACTIVE, organizationId } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const user = User.create(email, name, passwordHash, organizationId || null, status);

    // Guardar en el repositorio
    return await this.userRepository.create(user);
  }
}
