import { Type } from 'class-transformer';
import {
  IsInt,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  Min,
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

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  responsibilities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  reportsTo?: string;
}

class DepartmentRoutineGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cadence?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}

class DepartmentActivityComponentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  component?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  owner?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];
}

class DepartmentCommunicationLineDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  purpose?: string;
}

class DepartmentDataPackItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  system?: string;
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
  @IsString()
  @MaxLength(12000)
  core_responsibilities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  deliverables?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentRoleDto)
  roles?: DepartmentRoleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentRoutineGroupDto)
  operational_routines?: DepartmentRoutineGroupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentDataPackItemDto)
  data_pack?: DepartmentDataPackItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentActivityComponentDto)
  activities?: DepartmentActivityComponentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentCommunicationLineDto)
  communication_lines?: DepartmentCommunicationLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  budget?: string;
}

export class UpdateDepartmentConfigDto extends CreateDepartmentDto {}
