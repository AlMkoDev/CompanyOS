import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateDepartmentDto, UpdateDepartmentConfigDto } from './dto/department.dto';

@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  async create(@CurrentUser('companyId') companyId: string, @Body() data: CreateDepartmentDto) {
    return this.departmentsService.create(companyId, data);
  }

  @Get()
  async findAll(@CurrentUser('companyId') companyId: string) {
    return this.departmentsService.findAll(companyId);
  }

  @Get('template/:key')
  async findByTemplateKey(
    @CurrentUser('companyId') companyId: string,
    @Param('key') key: string,
  ) {
    return this.departmentsService.findByTemplateKey(companyId, key);
  }

  @Post('bootstrap-standard')
  async bootstrapStandard(@CurrentUser('companyId') companyId: string) {
    return this.departmentsService.bootstrapStandard(companyId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.findOne(id, companyId);
  }

  @Patch(':id/config')
  async updateConfig(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() data: UpdateDepartmentConfigDto,
  ) {
    return this.departmentsService.updateConfig(id, companyId, data);
  }
}
