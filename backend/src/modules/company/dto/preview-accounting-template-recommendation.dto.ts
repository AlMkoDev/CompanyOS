import { Type } from 'class-transformer';
import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdateCompanyAccountingProfileDto } from './update-company.dto';

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
}
