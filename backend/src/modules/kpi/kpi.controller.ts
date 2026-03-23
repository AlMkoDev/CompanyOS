import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';

@Controller('kpis')
@UseGuards(JwtAuthGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  findAll(@CurrentUser('companyId') companyId: string, @Query('departmentId') departmentId?: string) {
    return this.kpiService.findAll(companyId, departmentId);
  }

  @Get(':id')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.kpiService.findOne(companyId, id);
  }

  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() data: CreateKpiDto) {
    return this.kpiService.create({ ...data, company_id: companyId });
  }

  @Patch(':id')
  update(@CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() data: UpdateKpiDto) {
    return this.kpiService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.kpiService.remove(companyId, id);
  }
}
