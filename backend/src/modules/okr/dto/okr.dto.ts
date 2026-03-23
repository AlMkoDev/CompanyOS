import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOkrCycleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class CreateObjectiveDto {
  @IsString()
  @MinLength(1)
  cycle_id: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;
}

export class CreateKeyResultDto {
  @IsString()
  @MinLength(1)
  objective_id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @Type(() => Number)
  @IsNumber()
  initial_value: number;

  @Type(() => Number)
  @IsNumber()
  target_value: number;

  @IsOptional()
  @IsDateString()
  target_date?: string;
}

export class SubmitOkrCheckInDto {
  @Type(() => Number)
  @IsNumber()
  value: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  confidence: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
