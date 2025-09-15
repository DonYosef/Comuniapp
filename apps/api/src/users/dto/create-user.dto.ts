import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsEnum } from 'class-validator';
import { RoleName } from '@prisma/client';

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

  @ApiProperty({
    description: 'Rol del usuario',
    enum: RoleName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleName)
  roleName?: RoleName;

  @ApiProperty({
    description: 'ID de la organización',
    example: 'org_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
