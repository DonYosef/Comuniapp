import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  name: string;

  @ApiProperty({
    description: 'Estado del usuario',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'ID de la organización',
    example: 'org_123',
    required: false,
  })
  organizationId?: string;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Roles del usuario',
    required: false,
  })
  roles?: any[];

  @ApiProperty({
    description: 'Unidades asociadas al usuario',
    required: false,
  })
  userUnits?: any[];

  @ApiProperty({
    description: 'Comunidades administradas por el usuario',
    required: false,
  })
  communityAdmins?: any[];
}
