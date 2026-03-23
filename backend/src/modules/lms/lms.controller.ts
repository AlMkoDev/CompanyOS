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
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateCourseDto,
  EnrolEmployeeDto,
  UpdateEnrolmentStatusDto,
} from './dto/lms.dto';

@Controller('lms')
@UseGuards(JwtAuthGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Post('courses')
  async createCourse(@Req() req: any, @Body() data: CreateCourseDto) {
    return this.lmsService.createCourse(req.user.companyId, data);
  }

  @Get('courses')
  async getCourses(@Req() req: any) {
    return this.lmsService.getCourses(req.user.companyId);
  }

  @Post('enrolments')
  async enrolEmployee(@Req() req: any, @Body() body: EnrolEmployeeDto) {
    return this.lmsService.enrolEmployee(req.user.companyId, body.courseId, body.employeeId);
  }

  @Patch('enrolments/:id')
  async updateEnrolmentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateEnrolmentStatusDto,
  ) {
    return this.lmsService.updateEnrolmentStatus(req.user.companyId, id, body.status, body.score);
  }

  @Get('my-certificates')
  async getMyCertificates(@Req() req: any) {
    return this.lmsService.getEmployeeCertificates(req.user.companyId, req.user.userId);
  }
}
