import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateKpiDto {
  @IsOptional()
  @IsString()
  department_id?: string;

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
  @MaxLength(2000)
  formula?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  data_source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  owner_role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  target?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class UpdateKpiDto extends CreateKpiDto {}
