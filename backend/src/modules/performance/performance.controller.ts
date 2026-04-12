import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { CurrentUser } from '../../common/decorators/user.decorator';
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
  constructor(
    private performanceService: PerformanceService,
    private prisma: PrismaService,
  ) {}

  private async getEmployeeId(user: AuthenticatedUser) {
    const directEmployeeId = user.employeeId;
    if (directEmployeeId) {
      return directEmployeeId;
    }

    const companyId = user.companyId;
    const email = user.email;

    if (!companyId || !email) {
      throw new UnauthorizedException('Authenticated employee context is unavailable.');
    }

    const employee = await this.prisma.employee.findFirst({
      where: {
        company_id: companyId,
        email,
      },
      select: { id: true },
    });

    if (!employee) {
      throw new UnauthorizedException('No employee profile is linked to this account.');
    }

    return employee.id;
  }

  @Post('cycles')
  createCycle(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateReviewCycleDto) {
    return this.performanceService.createCycle(user.companyId, data);
  }

  @Get('cycles')
  getCycles(@CurrentUser() user: AuthenticatedUser) {
    return this.performanceService.getCycles(user.companyId);
  }

  @Get('cycles/:id')
  getCycleDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.performanceService.getCycleDetail(user.companyId, id);
  }

  @Post('cycles/:id/start')
  startCycle(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.performanceService.startCycleReviews(id, user.companyId);
  }

  @Get('reviews/my')
  async getMyReview(@CurrentUser() user: AuthenticatedUser, @Query('cycleId') cycleId: string) {
    return this.performanceService.getEmployeeReview(await this.getEmployeeId(user), cycleId);
  }

  @Patch('reviews/:id/self')
  async submitSelfAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SubmitSelfAssessmentDto,
  ) {
    return this.performanceService.submitSelfAssessment(
      user.companyId,
      await this.getEmployeeId(user),
      id,
      body.assessment,
    );
  }

  @Patch('reviews/:id/manager')
  async submitManagerAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: SubmitManagerAssessmentDto,
  ) {
    return this.performanceService.submitManagerAssessment(
      user.companyId,
      await this.getEmployeeId(user),
      id,
      data.assessment,
      data.rating,
    );
  }

  @Post('reviews/:id/feedback-request')
  async requestFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: RequestFeedbackDto,
  ) {
    return this.performanceService.requestFeedback(
      user.companyId,
      await this.getEmployeeId(user),
      id,
      body.providerId,
    );
  }

  @Get('feedback/pending')
  async getPendingFeedback(@CurrentUser() user: AuthenticatedUser) {
    return this.performanceService.getPendingFeedback(await this.getEmployeeId(user));
  }

  @Patch('feedback/:id/submit')
  async submitFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SubmitFeedbackDto,
  ) {
    return this.performanceService.submitFeedback(
      user.companyId,
      await this.getEmployeeId(user),
      id,
      body.answers,
    );
  }

  @Get('cycles/:id/stats')
  getStats(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.performanceService.getCompletionStats(user.companyId, id);
  }
}
