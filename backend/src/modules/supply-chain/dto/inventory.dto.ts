import { Type } from 'class-transformer';
import { LedgerEntryType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';

export class ReceiveStockDto {
  @IsString()
  product_id: string;

  @IsString()
  location_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason_code?: string;
}

export class AdjustStockDto {
  @IsString()
  product_id: string;

  @IsString()
  location_id: string;

  @Type(() => Number)
  @IsNumber()
  @NotEquals(0)
  quantity_change: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason_code?: string;
}

export class TransferStockDto {
  @IsString()
  product_id: string;

  @IsString()
  from_location_id: string;

  @IsString()
  to_location_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_id?: string;
}

export class FulfillStockDto {
  @IsString()
  product_id: string;

  @IsString()
  location_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_id?: string;
}

export class UpdateReorderPointDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorder_point: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  eoq?: number;
}

export class UpdateReorderPointAltDto extends UpdateReorderPointDto {
  @IsString()
  product_id: string;

  @IsString()
  location_id: string;
}

export class CreateLedgerEntryDto {
  @IsString()
  product_id: string;

  @IsString()
  location_id: string;

  @IsEnum(LedgerEntryType)
  entry_type: LedgerEntryType;

  @Type(() => Number)
  @IsNumber()
  @NotEquals(0)
  quantity_change: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reason_code?: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}
