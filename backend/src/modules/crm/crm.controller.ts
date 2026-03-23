import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateActivityDto,
  CreateCrmAccountDto,
  CreateCrmContactDto,
  CreateDealDto,
  CreateHealthScoreDto,
  CreateRenewalOpportunityDto,
  UpdateDealStageDto,
} from './dto/crm.dto';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('accounts')
  async createAccount(@Req() req: any, @Body() data: CreateCrmAccountDto) {
    return this.crmService.createAccount(req.user.companyId, data);
  }

  @Get('accounts')
  async getAccounts(@Req() req: any) {
    return this.crmService.getAccounts(req.user.companyId);
  }

  @Post('contacts')
  async createContact(@Req() req: any, @Body() data: CreateCrmContactDto) {
    return this.crmService.createContact(req.user.companyId, data);
  }

  @Post('deals')
  async createDeal(@Req() req: any, @Body() data: CreateDealDto) {
    return this.crmService.createDeal(req.user.companyId, data);
  }

  @Get('deals/:id')
  async getDeal(@Req() req: any, @Param('id') id: string) {
    return this.crmService.getDeal(req.user.companyId, id);
  }

  @Patch('deals/:id/stage')
  async updateDealStage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateDealStageDto,
  ) {
    return this.crmService.updateDealStage(req.user.companyId, id, body.stage, body.probability);
  }

  @Get('pipeline')
  async getPipeline(@Req() req: any) {
    return this.crmService.getPipeline(req.user.companyId);
  }

  @Get('activities')
  async getActivities(
    @Req() req: any,
    @Query('dealId') dealId?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.crmService.getActivities(req.user.companyId, dealId, contactId);
  }

  @Post('activities')
  async createActivity(@Req() req: any, @Body() data: CreateActivityDto) {
    return this.crmService.createActivity(req.user.companyId, data);
  }

  @Get('forecast')
  async getForecast(@Req() req: any) {
    return this.crmService.getForecast(req.user.companyId);
  }

  @Get('data-quality')
  async getDataQuality(@Req() req: any) {
    return this.crmService.getDataQuality(req.user.companyId);
  }

  // --- Account Management (VF-SAL-003) ---

  @Post('accounts/:id/health')
  async createHealthScore(@Req() req: any, @Param('id') id: string, @Body() data: CreateHealthScoreDto) {
    return this.crmService.createHealthScore(req.user.companyId, id, data);
  }

  @Get('accounts/:id/health')
  async getAccountHealthHistory(@Req() req: any, @Param('id') id: string) {
    return this.crmService.getAccountHealthHistory(req.user.companyId, id);
  }

  @Post('accounts/:id/renewals')
  async createRenewalOpportunity(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: CreateRenewalOpportunityDto,
  ) {
    return this.crmService.createRenewalOpportunity(req.user.companyId, id, data);
  }

  @Get('renewals/upcoming')
  async getUpcomingRenewals(@Req() req: any) {
    return this.crmService.getUpcomingRenewals(req.user.companyId);
  }
}
