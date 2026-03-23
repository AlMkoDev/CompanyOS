import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateErCaseDetailsDto, CreateErTicketDto } from './dto/er-engagement.dto';

@Injectable()
export class ErEngagementService {
  constructor(private prisma: PrismaService) {}

  // --- HR Tickets ---

  async createTicket(companyId: string, userId: string, data: CreateErTicketDto) {
    return this.prisma.hRTicket.create({
      data: {
        ...data,
        company_id: companyId,
        raised_by: userId,
        status: 'new',
      },
    });
  }

  async getTickets(companyId: string) {
    return this.prisma.hRTicket.findMany({
      where: { company_id: companyId },
    });
  }

  // --- ER Cases ---

  async createCase(employeeId: string, data: CreateErCaseDetailsDto) {
    return this.prisma.eRCase.create({
      data: {
        ...data,
        employee_id: employeeId,
        status: 'open',
      },
    });
  }

  async getCases(companyId: string) {
    // Note: ERCase doesn't have company_id directly in the view check
    // but we can join through employee
    return this.prisma.eRCase.findMany({
      where: {
        employee: {
          company_id: companyId,
        },
      },
      include: { employee: true },
    });
  }
}
