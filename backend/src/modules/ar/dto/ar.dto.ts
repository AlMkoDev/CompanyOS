import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
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

  @IsOptional()
  @IsBoolean()
  internal_only?: boolean;

  @IsOptional()
  @IsBoolean()
  customer_visible?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  task_title?: string;

  @IsOptional()
  @IsDateString()
  task_due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  task_priority?: string;
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

export class CreateDisputeAttachmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  file_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  file_type: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class IntakeEvidenceItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  file_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  file_type: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  file_size_mb?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreatePortalDisputeIntakeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  invoice_no: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  dispute_type: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  disputed_amount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customer_name: string;

  @IsEmail()
  submitter_email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  submitter_phone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  brief_description: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferred_resolution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  urgency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reason_code?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntakeEvidenceItemDto)
  evidence_items?: IntakeEvidenceItemDto[];
}
