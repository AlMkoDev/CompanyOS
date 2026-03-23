import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateOffboardingPlanDto,
  CreateOnboardingPlanDto,
  SubmitExitInterviewDto,
  UpdateDeprovisioningDto,
  UpdateOnboardingTaskStatusDto,
} from './dto/onboarding.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('plans')
  async getActivePlans(@Req() req: any) {
    return this.onboardingService.getActivePlans(req.user.companyId);
  }

  @Post('plans')
  async createPlan(@Req() req: any, @Body() body: CreateOnboardingPlanDto) {
    return this.onboardingService.createPlan(
      req.user.companyId,
      body.employeeId,
      new Date(body.startDate),
    );
  }

  @Get('plans/:employeeId')
  async getPlanDetail(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.onboardingService.getPlanDetail(req.user.companyId, employeeId);
  }

  @Patch('tasks/:id')
  async updateTaskStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateOnboardingTaskStatusDto) {
    return this.onboardingService.updateTaskStatus(req.user.companyId, id, body.status);
  }

  @Post('offboarding')
  async createOffboarding(@Req() req: any, @Body() body: CreateOffboardingPlanDto) {
    return this.onboardingService.createOffboardingPlan(
      req.user.companyId,
      body.employeeId,
      new Date(body.lastDay),
    );
  }

  @Get('offboarding/:employeeId')
  async getOffboardingDetail(@Req() req: any, @Param('employeeId') employeeId: string) {
    return this.onboardingService.getOffboardingDetail(req.user.companyId, employeeId);
  }

  @Post('offboarding/:employeeId/interview')
  async submitExitInterview(@Req() req: any, @Param('employeeId') id: string, @Body() data: SubmitExitInterviewDto) {
    return this.onboardingService.submitExitInterview(req.user.companyId, req.user.userId, id, data);
  }

  @Patch('offboarding/:employeeId/deprovision')
  async updateDeprovisioning(@Req() req: any, @Param('employeeId') id: string, @Body() body: UpdateDeprovisioningDto) {
    return this.onboardingService.updateDeprovisioningStatus(req.user.companyId, id, body.status);
  }
}
