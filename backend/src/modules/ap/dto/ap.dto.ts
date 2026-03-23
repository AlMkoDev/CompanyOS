import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  address?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @MinLength(1)
  vendor_id: string;

  @IsOptional()
  @IsDateString()
  order_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total?: number;
}

export class CreateAPInvoiceDto {
  @IsString()
  @MinLength(1)
  vendor_id: string;

  @IsOptional()
  @IsString()
  po_id?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsDateString()
  invoice_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  invoice_no?: string;
}

export class CreateAPGoodsReceiptDto {
  @IsString()
  @MinLength(1)
  po_id: string;

  @IsOptional()
  @IsDateString()
  receipt_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_received?: number;
}

export class GeneratePaymentRunDto {
  @IsArray()
  invoiceIds: string[];
}
