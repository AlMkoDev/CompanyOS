import { Type } from 'class-transformer';
import {
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

export class CreateCrmAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  website?: string;
}

export class CreateCrmContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  first_name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  last_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  account_id?: string;
}

export class CreateDealDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  account_id?: string;

  @IsOptional()
  @IsString()
  contact_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  stage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;
}

export class UpdateDealStageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  stage: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;
}

export class CreateActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  type: string;

  @IsOptional()
  @IsString()
  deal_id?: string;

  @IsOptional()
  @IsString()
  contact_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateHealthScoreDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsDateString()
  measured_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateRenewalOpportunityDto {
  @IsDateString()
  renewal_date: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expected_value: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
