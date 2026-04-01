import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  subtype?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  parent_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  normal_balance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  sensitivity_tier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fs_placement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_treatment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  account_owner_id?: string;

  @IsOptional()
  @Type(() => Boolean)
  is_header?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  is_contra?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  budget_enabled?: boolean;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  subtype?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  parent_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  normal_balance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  sensitivity_tier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fs_placement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tax_treatment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  account_owner_id?: string;

  @IsOptional()
  @Type(() => Boolean)
  is_header?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  is_contra?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  budget_enabled?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}

export class JournalEntryLineDto {
  @IsString()
  @MinLength(1)
  account_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  debit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  narration?: string;
}

export class CreateJournalEntryDto {
  @IsOptional()
  @IsDateString()
  entry_date?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class ClosePeriodDto {
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}

export class BankStatementLineDto {
  @IsDateString()
  date: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @Type(() => Number)
  @IsNumber()
  balance: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class ImportBankStatementDto {
  @IsString()
  @MinLength(1)
  account_id: string;

  @IsDateString()
  statement_date: string;

  @Type(() => Number)
  @IsNumber()
  opening_balance: number;

  @Type(() => Number)
  @IsNumber()
  closing_balance: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankStatementLineDto)
  lines: BankStatementLineDto[];
}

export class ReconcileBankStatementLineDto {
  @IsString()
  @MinLength(1)
  line_id: string;

  @IsString()
  @MinLength(1)
  journal_entry_id: string;
}
