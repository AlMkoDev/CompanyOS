import { SupplierStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  supplier_code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @IsOptional()
  @IsObject()
  contact_info?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bank_details?: Record<string, unknown>;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  supplier_code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @IsOptional()
  @IsObject()
  contact_info?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bank_details?: Record<string, unknown>;
}

export class UpdateSupplierStatusDto {
  @IsEnum(SupplierStatus)
  status: SupplierStatus;
}

export class SupplierReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AddSupplierRiskDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  risk_score: number;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

export class UpdateSupplierRiskDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  risk_score?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
