import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({
    description: 'ID único del rol',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador',
  })
  name: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol con acceso completo al sistema',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Lista de permisos del rol',
    example: ['users:read', 'users:write', 'payments:read'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Fecha de creación del rol',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del rol',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
