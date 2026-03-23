import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCourseDto } from './dto/lms.dto';

@Injectable()
export class LmsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyCourse(companyId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, company_id: companyId },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private async getCompanyEmployee(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, company_id: companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  private async getCompanyEnrolment(companyId: string, enrolmentId: string) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: {
        id: enrolmentId,
        course: {
          company_id: companyId,
        },
      },
    });
    if (!enrolment) throw new NotFoundException('Enrolment not found');
    return enrolment;
  }

  // --- Courses ---

  async createCourse(companyId: string, data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getCourses(companyId: string) {
    return this.prisma.course.findMany({
      where: { company_id: companyId },
    });
  }

  // --- Enrolments ---

  async enrolEmployee(companyId: string, courseId: string, employeeId: string) {
    await this.getCompanyCourse(companyId, courseId);
    await this.getCompanyEmployee(companyId, employeeId);

    return this.prisma.enrolment.create({
      data: {
        course_id: courseId,
        employee_id: employeeId,
        status: 'enrolled',
      },
    });
  }

  async updateEnrolmentStatus(companyId: string, enrolmentId: string, status: string, score?: number) {
    await this.getCompanyEnrolment(companyId, enrolmentId);

    const data: any = { status };
    if (status === 'completed') {
      data.completed_at = new Date();
    }
    if (score !== undefined) {
      data.score = score;
    }

    return this.prisma.enrolment.update({
      where: { id: enrolmentId },
      data,
    });
  }

  async getEmployeeCertificates(companyId: string, employeeId: string) {
    return this.prisma.certificate.findMany({
      where: {
        employee_id: employeeId,
        employee: {
          company_id: companyId,
        },
      },
    });
  }
}
