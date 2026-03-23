import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class DepartmentRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;
}

export class CreateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  template_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  mandate?: string;

  @IsOptional()
  @IsArray()
  core_responsibilities?: unknown[];

  @IsOptional()
  @IsArray()
  deliverables?: unknown[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentRoleDto)
  roles?: DepartmentRoleDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  budget?: string;
}

export class UpdateDepartmentConfigDto extends CreateDepartmentDto {}
