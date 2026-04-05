import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { UpdateCompanyAccountingProfileDto } from './update-company.dto';

export class PreviewAccountingTemplateRecommendationDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateCompanyAccountingProfileDto)
  accounting_profile?: UpdateCompanyAccountingProfileDto;
}
