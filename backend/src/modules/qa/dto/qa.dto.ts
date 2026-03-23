import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNcrDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  severity?: string;
}

export class UpdateNcrDto extends CreateNcrDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class RootCauseAnalysisDto {
  @IsArray()
  five_whys: unknown[];

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  final_root_cause: string;
}

export class CreateCorrectiveActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class UpdateCorrectiveActionDto extends CreateCorrectiveActionDto {}

export class CreateChecklistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category: string;

  @IsArray()
  items: unknown[];
}

export class UpdateChecklistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsArray()
  items?: unknown[];
}

export class CreateAuditFindingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  severity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class UpdateAuditFindingDto extends CreateAuditFindingDto {}
