import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateComplianceDeadlineDto {
  @IsString()
  deadline_type: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateComplianceDeadlineDto {
  @IsOptional()
  @IsString()
  deadline_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class FileComplianceDeadlineDto {
  @IsDateString()
  filing_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
