import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Email del usuario', example: 'usuario@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
