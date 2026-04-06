import { Type } from 'class-transformer';
import { IsArray, IsIn, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UpdateCompanyAccountingProfileDto } from './update-company.dto';

export class AccountingTemplateCollisionResolutionDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsUUID()
  existing_id?: string;

  @IsString()
  @IsIn(['KEEP_EXISTING_SKIP_TEMPLATE', 'ADOPT_TEMPLATE_REMEDIATE_LEGACY', 'MERGE_INTO_EXISTING_PRESERVE_DATA'])
  resolution!: string;
}

export class PreviewAccountingTemplateRecommendationDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCompanyAccountingProfileDto)
  accounting_profile?: UpdateCompanyAccountingProfileDto;

  @IsOptional()
  @IsString()
  @IsIn(['FULL_RECOMMENDED', 'CORE_ONLY', 'CORE_AND_REGULATORY', 'MODULE_SELECTED'])
  activation_scope?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selected_module_codes?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingTemplateCollisionResolutionDto)
  collision_resolutions?: AccountingTemplateCollisionResolutionDto[];
}
