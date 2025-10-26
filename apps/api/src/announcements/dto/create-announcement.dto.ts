import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AnnouncementType } from '@prisma/client';

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
