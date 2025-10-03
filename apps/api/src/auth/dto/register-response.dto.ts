import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Usuario registrado exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'ID del usuario creado',
    example: 'user_123',
  })
  userId: string;

  @ApiProperty({
    description: 'Email del usuario registrado',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario registrado',
    example: 'Juan Pérez',
  })
  name: string;
}
