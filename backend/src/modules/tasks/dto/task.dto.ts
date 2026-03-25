import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const TASK_STATUSES = ['open', 'in-progress', 'review', 'done', 'blocked'] as const;

export class CreateTaskDto {
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
  department_id?: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  priority?: string;
}

export class UpdateTaskStatusDto {
  @IsString()
  @IsIn(TASK_STATUSES)
  status: (typeof TASK_STATUSES)[number];
}
