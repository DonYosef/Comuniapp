import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  communityId: string;
}
