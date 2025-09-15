import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PlanType } from '../../domain/entities/organization.entity';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Comunidad Los Robles',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Plan de la organización',
    enum: PlanType,
    default: PlanType.BASIC,
  })
  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;
}
