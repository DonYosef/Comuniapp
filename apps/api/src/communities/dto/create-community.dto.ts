import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  ValidateNested,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export enum CommunityType {
  CONDOMINIO = 'CONDOMINIO',
  EDIFICIO = 'EDIFICIO',
}

export class CreateCommonSpaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(CommunityType)
  type: CommunityType;

  @IsInt()
  @Min(1)
  totalUnits: number;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear())
  constructionYear?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  floors?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  unitsPerFloor?: number;

  @IsObject()
  @IsOptional()
  buildingStructure?: { [floor: number]: string[] };

  @Transform(({ value }) => {
    // Aceptar tanto objeto { Piscina: 1 } como arreglo [{name, quantity}]
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') {
      return Object.entries(value).map(([name, quantity]) => ({
        name,
        quantity: Number(quantity) || 1,
      }));
    }
    return undefined;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCommonSpaceDto)
  @IsOptional()
  commonSpaces?: CreateCommonSpaceDto[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
