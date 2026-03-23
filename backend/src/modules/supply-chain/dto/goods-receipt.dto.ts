import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ResolveGoodsReceiptAdjustmentDto {
  @IsString()
  @MinLength(1)
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adjustedQty: number;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason: string;
}

export class ResolveGoodsReceiptDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ResolveGoodsReceiptAdjustmentDto)
  adjustments?: ResolveGoodsReceiptAdjustmentDto[];
}
