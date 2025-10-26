import { ParcelStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateParcelDto {
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientResidence?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  conciergeName?: string;

  @IsOptional()
  @IsString()
  conciergePhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsEnum(ParcelStatus)
  status?: ParcelStatus;
}
