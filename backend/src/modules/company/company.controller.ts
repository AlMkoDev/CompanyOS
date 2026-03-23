import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanySetupDto } from './dto/update-company-setup.dto';

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
    @Body() data: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, data);
  }

  @Patch('setup')
  async updateSetup(
    @CurrentUser('companyId') companyId: string,
    @Body() data: UpdateCompanySetupDto,
  ) {
    return this.companyService.updateSetupProgress(companyId, data);
  }
}
