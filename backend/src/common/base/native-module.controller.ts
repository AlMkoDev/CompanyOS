import { Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../modules/auth/jwt.strategy';
import { RolesGuard, Roles } from '../guards/roles.guard';

export abstract class BaseNativeModuleController {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly resourceName: string,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query() query: any, @Param('companyId') companyId: string) {
    return ((this.prisma as any)[this.resourceName] as any).findMany({
      where: { company_id: companyId, ...query },
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string, @Param('companyId') companyId: string) {
    return ((this.prisma as any)[this.resourceName] as any).findUnique({
      where: { id, company_id: companyId },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() data: any, @Param('companyId') companyId: string) {
    return ((this.prisma as any)[this.resourceName] as any).create({
      data: { ...data, company_id: companyId },
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: string, @Body() data: any, @Param('companyId') companyId: string) {
    return ((this.prisma as any)[this.resourceName] as any).update({
      where: { id, company_id: companyId },
      data,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string, @Param('companyId') companyId: string) {
    return ((this.prisma as any)[this.resourceName] as any).delete({
      where: { id, company_id: companyId },
    });
  }
}
