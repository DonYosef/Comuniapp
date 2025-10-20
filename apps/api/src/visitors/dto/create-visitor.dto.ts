import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsEmail } from 'class-validator';
import { VisitorStatus } from '@prisma/client';

export class CreateVisitorDto {
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  hostUserId: string;

  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsString()
  @IsNotEmpty()
  visitorDocument: string;

  @IsOptional()
  @IsString()
  visitorPhone?: string;

  @IsOptional()
  @IsEmail()
  visitorEmail?: string;

  @IsOptional()
  @IsString()
  residentName?: string;

  @IsOptional()
  @IsString()
  residentPhone?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['personal', 'business', 'maintenance', 'delivery', 'other'])
  visitPurpose: string;

  @IsDateString()
  @IsNotEmpty()
  expectedArrival: string;

  @IsDateString()
  @IsNotEmpty()
  expectedDeparture: string;

  @IsOptional()
  @IsString()
  vehicleInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(VisitorStatus)
  status?: VisitorStatus;
}
