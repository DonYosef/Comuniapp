import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Email del usuario', example: 'usuario@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
