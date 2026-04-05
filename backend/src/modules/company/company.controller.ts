import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanySetupDto } from './dto/update-company-setup.dto';
import { PreviewAccountingTemplateRecommendationDto } from './dto/preview-accounting-template-recommendation.dto';

@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async findOne(@CurrentUser('companyId') companyId: string) {
    return this.companyService.findOne(companyId);
  }

  @Patch()
  async update(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('roles') roles: string[],
    @CurrentUser('userId') userId: string,
    @Body() data: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, data, roles, userId);
  }

  @Get('accounting-profile/history')
  async listAccountingProfileAuditHistory(@CurrentUser('companyId') companyId: string) {
    return this.companyService.listAccountingProfileAuditHistory(companyId);
  }

  @Patch('setup')
  async updateSetup(
    @CurrentUser('companyId') companyId: string,
    @Body() data: UpdateCompanySetupDto,
  ) {
    return this.companyService.updateSetupProgress(companyId, data);
  }

  @Post('accounting-template-recommendation/preview')
  async previewAccountingTemplateRecommendation(
    @CurrentUser('companyId') companyId: string,
    @Body() data: PreviewAccountingTemplateRecommendationDto,
  ) {
    return this.companyService.previewAccountingTemplateRecommendation(
      companyId,
      data.accounting_profile,
    );
  }

  @Post('accounting-template-activation/dry-run')
  async previewAccountingTemplateActivation(
    @CurrentUser('companyId') companyId: string,
    @Body() data: PreviewAccountingTemplateRecommendationDto,
  ) {
    return this.companyService.previewAccountingTemplateActivation(
      companyId,
      data.accounting_profile,
    );
  }

  @Post('accounting-template-activation')
  async activateAccountingTemplate(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('roles') roles: string[],
    @CurrentUser('userId') userId: string,
    @Body() data: PreviewAccountingTemplateRecommendationDto,
  ) {
    return this.companyService.activateAccountingTemplate(
      companyId,
      roles,
      userId,
      data.accounting_profile,
    );
  }
}
