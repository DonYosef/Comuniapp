import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProrrateMethod } from '../../types/prisma.types';

export class CreateCommunityIncomeItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateCommunityIncomeDto {
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCommunityIncomeItemDto)
  items: CreateCommunityIncomeItemDto[];

  @IsEnum(ProrrateMethod)
  @IsNotEmpty()
  prorrateMethod: ProrrateMethod;
}
