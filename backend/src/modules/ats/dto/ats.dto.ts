import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const APPLICATION_STAGES = [
  'applied',
  'screened',
  'interview1',
  'interview2',
  'offer',
  'hired',
  'rejected',
] as const;

export class CreateRequisitionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  employment_type?: string;
}

export class CreateCandidateDto {
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
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resume_url?: string;
}

export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  requisition_id: string;

  @IsString()
  @MinLength(1)
  candidate_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

export class UpdateApplicationStageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  stage: (typeof APPLICATION_STAGES)[number] | string;
}

export class ScheduleInterviewDataDto {
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interview_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  interviewer_ids?: unknown[];
}

export class ScheduleInterviewDto {
  @IsString()
  @MinLength(1)
  applicationId: string;

  @Type(() => ScheduleInterviewDataDto)
  data: ScheduleInterviewDataDto;
}

export class SubmitScorecardDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  overall_rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;

  @IsOptional()
  @IsArray()
  competencies?: unknown[];
}
