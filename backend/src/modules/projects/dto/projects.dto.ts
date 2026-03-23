import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  rag_status?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class UpdateProjectDto extends CreateProjectDto {}

export class CreateProjectTaskDto {
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
  assignee_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  priority?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateProjectTaskDto extends CreateProjectTaskDto {}

export class CreateRaidItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  type: string;

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
  @MaxLength(20)
  severity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateRaidItemDto extends CreateRaidItemDto {}

export class ProjectBudgetDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_allocated: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actual_spent: number;
}
