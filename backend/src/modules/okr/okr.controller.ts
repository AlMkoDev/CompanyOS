import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { OkrService } from './okr.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateKeyResultDto,
  CreateObjectiveDto,
  CreateOkrCycleDto,
  SubmitOkrCheckInDto,
} from './dto/okr.dto';

@Controller('okr')
@UseGuards(JwtAuthGuard)
export class OkrController {
  constructor(private okrService: OkrService) {}

  @Post('cycles')
  createCycle(@Request() req: any, @Body() data: CreateOkrCycleDto) {
    return this.okrService.createCycle(req.user.companyId, data);
  }

  @Get('cycles')
  getCycles(@Request() req: any) {
    return this.okrService.getCycles(req.user.companyId);
  }

  @Post('objectives')
  createObjective(@Request() req: any, @Body() data: CreateObjectiveDto) {
    return this.okrService.createObjective(req.user.companyId, data);
  }

  @Get('explorer')
  getExplorer(@Request() req: any, @Query('cycleId') cycleId: string) {
    return this.okrService.getOkrTree(req.user.companyId, cycleId);
  }

  @Post('key-results')
  createKeyResult(@Request() req: any, @Body() data: CreateKeyResultDto) {
    return this.okrService.createKeyResult(req.user.companyId, data);
  }

  @Patch('key-results/:id/check-in')
  submitCheckIn(@Request() req: any, @Param('id') id: string, @Body() data: SubmitOkrCheckInDto) {
    return this.okrService.submitCheckIn(req.user.companyId, id, data);
  }

  @Get('dashboard/health')
  getHealth(@Request() req: any) {
    return this.okrService.getExecutiveHealth(req.user.companyId);
  }
}
