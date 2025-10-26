import { AnnouncementType } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @IsUUID()
  @IsNotEmpty()
  communityId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;
}
