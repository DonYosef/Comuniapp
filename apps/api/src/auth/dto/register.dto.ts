import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class RegisterDto {
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
    description: 'Confirmación de contraseña',
    example: 'miContraseña123',
    minLength: 6,
  })
  @IsString({ message: 'La confirmación de contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @MinLength(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' })
  confirmPassword: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'ID de la organización',
    example: 'org_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Aceptación de términos y condiciones',
    example: true,
  })
  @IsBoolean({ message: 'Debe aceptar los términos y condiciones' })
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  acceptTerms: boolean;
}
