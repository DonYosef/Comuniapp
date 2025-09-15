import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 12);

    return this.prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name || 'Usuario', // Proporcionar un valor por defecto si name es undefined
        passwordHash,
      },
    });
  }
}
