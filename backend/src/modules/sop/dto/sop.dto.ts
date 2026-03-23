import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSopDto {
  @IsOptional()
  @IsString()
  department_id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  purpose?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  trigger?: string;

  @IsOptional()
  raci?: unknown;

  @IsOptional()
  procedure?: unknown;

  @IsOptional()
  approval_matrix?: unknown;

  @IsOptional()
  output_standard?: unknown;

  @IsOptional()
  systems_used?: unknown;

  @IsOptional()
  exceptions?: unknown;

  @IsOptional()
  related_documents?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  version?: number;
}

export class UpdateSopDto extends CreateSopDto {}
