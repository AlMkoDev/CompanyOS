import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const ABC_CLASSES = ['A', 'B', 'C'] as const;
const XYZ_CLASSES = ['X', 'Y', 'Z'] as const;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  sku: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unit_of_measure: string;

  @IsOptional()
  @IsIn(ABC_CLASSES)
  abc_class?: (typeof ABC_CLASSES)[number];

  @IsOptional()
  @IsIn(XYZ_CLASSES)
  xyz_class?: (typeof XYZ_CLASSES)[number];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  sku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  unit_of_measure?: string;

  @IsOptional()
  @IsIn(ABC_CLASSES)
  abc_class?: (typeof ABC_CLASSES)[number];

  @IsOptional()
  @IsIn(XYZ_CLASSES)
  xyz_class?: (typeof XYZ_CLASSES)[number];
}

export class UpdateProductClassificationDto {
  @IsOptional()
  @IsIn(ABC_CLASSES)
  abc_class?: (typeof ABC_CLASSES)[number];

  @IsOptional()
  @IsIn(XYZ_CLASSES)
  xyz_class?: (typeof XYZ_CLASSES)[number];
}

export class AddProductSupplierDto {
  @IsString()
  @MinLength(1)
  supplier_id: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unit_cost: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lead_time_days: number;

  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;
}

export class UpdateProductSupplierDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unit_cost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  lead_time_days?: number;

  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;
}
