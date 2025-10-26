import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';

import { RoleName } from '../../domain/entities/role.entity';
import { UserStatus } from '../../domain/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'miContraseña123',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Estado del usuario',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'El estado debe ser uno de los valores válidos' })
  status?: UserStatus;

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

  @ApiProperty({
    description: 'Rol del usuario',
    enum: RoleName,
    example: RoleName.RESIDENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleName, { message: 'El rol debe ser uno de los valores válidos' })
  roleName?: RoleName;

  @ApiProperty({
    description: 'ID de la unidad donde reside el usuario',
    example: 'unit_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  unitId?: string;
}
