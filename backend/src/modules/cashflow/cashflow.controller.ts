import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CashFlowService } from './cashflow.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CreateCashForecastDto, CreateCashItemDto } from './dto/cashflow.dto';

@Controller('cashflow')
@UseGuards(JwtAuthGuard)
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Post()
  async createForecast(@Req() req: any, @Body() body: CreateCashForecastDto) {
    return this.cashFlowService.createForecast(
      req.user.companyId,
      new Date(body.startDate),
      req.user.userId,
    );
  }

  @Get()
  async getForecasts(@Req() req: any) {
    return this.cashFlowService.getForecasts(req.user.companyId);
  }

  @Get(':id')
  async getForecastDetail(@Req() req: any, @Param('id') id: string) {
    return this.cashFlowService.getForecastDetail(req.user.companyId, id);
  }

  @Post('weeks/:weekId/items')
  async addCashItem(@Req() req: any, @Param('weekId') weekId: string, @Body() data: CreateCashItemDto) {
    return this.cashFlowService.addCashItem(req.user.companyId, weekId, data);
  }

  @Post(':id/populate')
  async populateFromErp(@Req() req: any, @Param('id') id: string) {
    return this.cashFlowService.populateFromErp(req.user.companyId, id);
  }

  @Post(':id/sign-off')
  async signOffForecast(@Req() req: any, @Param('id') id: string) {
    return this.cashFlowService.signOffForecast(
      req.user.companyId,
      id,
      req.user.userId,
    );
  }
}
