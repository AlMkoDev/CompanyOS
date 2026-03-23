import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SopService } from './sop.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateSopDto, UpdateSopDto } from './dto/sop.dto';

@Controller('sops')
@UseGuards(JwtAuthGuard)
export class SopController {
  constructor(private readonly sopService: SopService) {}

  @Get()
  findAll(@CurrentUser('companyId') companyId: string, @Query('departmentId') departmentId?: string) {
    return this.sopService.findAll(companyId, departmentId);
  }

  @Get(':id')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.sopService.findOne(companyId, id);
  }

  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() data: CreateSopDto) {
    return this.sopService.create({ ...data, company_id: companyId });
  }

  @Patch(':id')
  update(@CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() data: UpdateSopDto) {
    return this.sopService.update(companyId, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.sopService.remove(companyId, id);
  }
}
