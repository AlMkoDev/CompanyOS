import { IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  first_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  last_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  emp_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  national_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  employment_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  salary_grade?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsDateString()
  hire_date: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  position_id?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  profile_data?: Record<string, unknown>;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  emp_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  national_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  employment_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  salary_grade?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  position_id?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  profile_data?: Record<string, unknown>;
}

export class CreatePositionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}

export class UploadEmployeeDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  file_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  file_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  document_type?: string;
}
