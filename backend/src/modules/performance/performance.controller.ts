import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateReviewCycleDto,
  RequestFeedbackDto,
  SubmitFeedbackDto,
  SubmitManagerAssessmentDto,
  SubmitSelfAssessmentDto,
} from './dto/performance.dto';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  @Post('cycles')
  createCycle(@Request() req: any, @Body() data: CreateReviewCycleDto) {
    return this.performanceService.createCycle(req.user.company_id, data);
  }

  @Get('cycles')
  getCycles(@Request() req: any) {
    return this.performanceService.getCycles(req.user.company_id);
  }

  @Get('cycles/:id')
  getCycleDetail(@Request() req: any, @Param('id') id: string) {
    return this.performanceService.getCycleDetail(req.user.company_id, id);
  }

  @Post('cycles/:id/start')
  startCycle(@Request() req: any, @Param('id') id: string) {
    return this.performanceService.startCycleReviews(id, req.user.company_id);
  }

  @Get('reviews/my')
  getMyReview(@Request() req: any, @Query('cycleId') cycleId: string) {
    return this.performanceService.getEmployeeReview(req.user.employee_id, cycleId);
  }

  @Patch('reviews/:id/self')
  submitSelfAssessment(@Request() req: any, @Param('id') id: string, @Body() body: SubmitSelfAssessmentDto) {
    return this.performanceService.submitSelfAssessment(req.user.company_id, req.user.employee_id, id, body.assessment);
  }

  @Patch('reviews/:id/manager')
  submitManagerAssessment(@Request() req: any, @Param('id') id: string, @Body() data: SubmitManagerAssessmentDto) {
    return this.performanceService.submitManagerAssessment(req.user.company_id, req.user.employee_id, id, data.assessment, data.rating);
  }

  @Post('reviews/:id/feedback-request')
  requestFeedback(@Request() req: any, @Param('id') id: string, @Body() body: RequestFeedbackDto) {
    return this.performanceService.requestFeedback(req.user.company_id, req.user.employee_id, id, body.providerId);
  }

  @Get('feedback/pending')
  getPendingFeedback(@Request() req: any) {
    return this.performanceService.getPendingFeedback(req.user.employee_id);
  }

  @Patch('feedback/:id/submit')
  submitFeedback(@Request() req: any, @Param('id') id: string, @Body() body: SubmitFeedbackDto) {
    return this.performanceService.submitFeedback(req.user.company_id, req.user.employee_id, id, body.answers);
  }

  @Get('cycles/:id/stats')
  getStats(@Request() req: any, @Param('id') id: string) {
    return this.performanceService.getCompletionStats(req.user.company_id, id);
  }
}
