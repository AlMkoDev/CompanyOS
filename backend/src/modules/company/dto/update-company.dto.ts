import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class UpdateCompanyAccountingProfileDto {
  @IsOptional()
  @IsString()
  primary_jurisdiction?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operating_jurisdictions?: string[];

  @IsOptional()
  @IsString()
  reporting_framework?: string;

  @IsOptional()
  @IsString()
  functional_currency?: string;

  @IsOptional()
  @IsString()
  presentation_currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  functional_currency_justification?: string;

  @IsOptional()
  @IsBoolean()
  zw_ias29_applicable?: boolean;

  @IsOptional()
  @IsBoolean()
  zw_prior_ias29_application?: boolean;

  @IsOptional()
  @IsBoolean()
  cross_border_operations?: boolean;

  @IsOptional()
  @IsBoolean()
  consolidates_subsidiaries?: boolean;

  @IsOptional()
  @IsBoolean()
  vat_registered?: boolean;

  @IsOptional()
  @IsBoolean()
  pfma_entity?: boolean;

  @IsOptional()
  @IsBoolean()
  sdl_exempt?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annual_payroll_estimate?: number;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsObject()
  brand_colors?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCompanyAccountingProfileDto)
  accounting_profile?: UpdateCompanyAccountingProfileDto;
}
