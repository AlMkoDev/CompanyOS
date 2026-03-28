import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
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
}

export class CreateARInvoiceDto {
  @IsString()
  @MinLength(1)
  customer_id: string;

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

export class RecordPaymentDto {
  @IsString()
  @MinLength(1)
  invoice_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class CreateCollectionCaseDto {
  @IsString()
  @MinLength(1)
  invoiceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CollectionActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SendReminderDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  channel?: string;
}

export class CreateDisputeDto {
  @IsString()
  @MinLength(1)
  invoice_id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  dispute_type: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  priority?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  disputed_amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  product_code?: string;

  @IsOptional()
  evidence_required?: string[];

  @IsOptional()
  blocks_payment?: boolean;

  @IsOptional()
  affects_revenue?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateDisputeStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  status: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  resolved_amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution_notes?: string;
}

export class CreateDisputeActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  activity_type: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateDisputeResolutionDto {
  @IsString()
  @MinLength(1)
  resolution_type: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  writeoff_amount?: number;
}

export class ApproveDisputeResolutionDto {
  @IsString()
  @MinLength(1)
  action: string;
}

export class MarkResolutionPostedDto {
  @IsOptional()
  posted_to_gl?: boolean;
}
