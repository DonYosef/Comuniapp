import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol con acceso completo al sistema',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @ApiProperty({
    description: 'Lista de permisos del rol',
    example: ['users:read', 'users:write', 'payments:read'],
    type: [String],
  })
  @IsArray({ message: 'Los permisos deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe especificar al menos un permiso' })
  @IsString({ each: true, message: 'Cada permiso debe ser una cadena de texto' })
  permissions: string[];
}
