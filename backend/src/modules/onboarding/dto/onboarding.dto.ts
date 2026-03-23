import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOnboardingPlanDto {
  @IsString()
  @MinLength(1)
  employeeId: string;

  @IsDateString()
  startDate: string;
}

export class UpdateOnboardingTaskStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  status: string;
}

export class CreateOffboardingPlanDto {
  @IsString()
  @MinLength(1)
  employeeId: string;

  @IsDateString()
  lastDay: string;
}

export class SubmitExitInterviewDto {
  @IsArray()
  answers: unknown[];

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  nps_score?: number;
}

export class UpdateDeprovisioningDto {
  @IsBoolean()
  status: boolean;
}
