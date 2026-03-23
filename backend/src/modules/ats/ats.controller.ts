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
import { AtsService } from './ats.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateApplicationDto,
  CreateCandidateDto,
  CreateRequisitionDto,
  ScheduleInterviewDto,
  SubmitScorecardDto,
  UpdateApplicationStageDto,
} from './dto/ats.dto';

@Controller('ats')
@UseGuards(JwtAuthGuard)
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Get('pipeline')
  async getPipeline(@Req() req: any, @Query('requisitionId') requisitionId?: string) {
    return this.atsService.getPipeline(req.user.companyId, requisitionId);
  }

  @Post('requisitions')
  async createRequisition(@Req() req: any, @Body() data: CreateRequisitionDto) {
    return this.atsService.createRequisition(req.user.companyId, data);
  }

  @Get('requisitions')
  async getRequisitions(@Req() req: any) {
    return this.atsService.getRequisitions(req.user.companyId);
  }

  @Get('requisitions/:id')
  async getRequisitionDetail(@Req() req: any, @Param('id') id: string) {
    return this.atsService.getRequisitionDetail(req.user.companyId, id);
  }

  @Post('candidates')
  async createCandidate(@Body() data: CreateCandidateDto) {
    return this.atsService.createCandidate(data);
  }

  @Get('candidates/:id')
  async getCandidateDetail(@Req() req: any, @Param('id') id: string) {
    return this.atsService.getCandidateDetail(req.user.companyId, id);
  }

  @Post('applications')
  async createApplication(@Req() req: any, @Body() data: CreateApplicationDto) {
    return this.atsService.createApplication(req.user.companyId, data);
  }

  @Patch('applications/:id/stage')
  async updateStage(@Req() req: any, @Param('id') id: string, @Body() body: UpdateApplicationStageDto) {
    return this.atsService.updateStage(req.user.companyId, id, body.stage);
  }

  @Post('interviews')
  async scheduleInterview(@Req() req: any, @Body() body: ScheduleInterviewDto) {
    return this.atsService.scheduleInterview(req.user.companyId, body.applicationId, body.data);
  }

  @Post('interviews/:id/scorecard')
  async submitScorecard(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: SubmitScorecardDto,
  ) {
    return this.atsService.submitScorecard(req.user.companyId, id, req.user.userId, data);
  }
}
