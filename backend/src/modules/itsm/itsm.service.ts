import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAssetDto,
  CreateChangeRequestDto,
  CreateKnowledgeArticleDto,
  CreateTicketDto,
} from './dto/itsm.dto';

@Injectable()
export class ItsmService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyTicket(companyId: string, id: string) {
    const ticket = await this.prisma.iTTicket.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  private async getCompanyChangeRequest(companyId: string, id: string) {
    const changeRequest = await this.prisma.changeRequest.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!changeRequest) {
      throw new NotFoundException('Change request not found');
    }

    return changeRequest;
  }

  // --- IT Tickets ---

  async createTicket(companyId: string, userId: string, data: CreateTicketDto) {
    const priority = data.priority || 'P3';
    const slaDeadline = new Date();
    
    // SLA Definitions (Hours)
    const slaHours = {
      P1: 4,
      P2: 8,
      P3: 24,
      P4: 48
    };

    slaDeadline.setHours(slaDeadline.getHours() + (slaHours[priority as keyof typeof slaHours] || 24));

    return this.prisma.iTTicket.create({
      data: {
        ...data,
        company_id: companyId,
        raised_by_id: userId,
        status: 'open',
        sla_deadline: slaDeadline,
      },
    });
  }

  async getTickets(companyId: string) {
    return this.prisma.iTTicket.findMany({
      where: { company_id: companyId },
      include: {
        raised_by: true,
        assigned_to: true,
        asset: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getTicketById(companyId: string, id: string) {
    const ticket = await this.prisma.iTTicket.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        raised_by: true,
        assigned_to: true,
        asset: true,
        change: true,
        major_log: true
      }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async resolveTicket(companyId: string, ticketId: string, rca?: string) {
    const ticket = await this.getCompanyTicket(companyId, ticketId);

    const resolvedAt = new Date();
    const mttrSeconds = Math.floor((resolvedAt.getTime() - ticket.created_at.getTime()) / 1000);

    // Update ticket
    const updatedTicket = await this.prisma.iTTicket.update({
      where: { id: ticketId },
      data: { 
        status: 'resolved',
        resolved_at: resolvedAt
      },
    });

    // If P1/P2, create/update Major Incident Log
    if (ticket.priority === 'P1' || ticket.priority === 'P2') {
      await this.prisma.majorIncidentLog.upsert({
        where: { ticket_id: ticketId },
        update: {
          resolved_at: resolvedAt,
          mttr_seconds: mttrSeconds,
          rca: rca
        },
        create: {
          ticket_id: ticketId,
          detected_at: ticket.created_at,
          resolved_at: resolvedAt,
          mttr_seconds: mttrSeconds,
          rca: rca
        }
      });
    }

    return updatedTicket;
  }

  // --- Change Requests ---

  async createChangeRequest(companyId: string, userId: string, data: CreateChangeRequestDto) {
    return this.prisma.changeRequest.create({
      data: {
        ...data,
        company_id: companyId,
        raised_by_id: userId,
        status: 'draft'
      }
    });
  }

  async getChangeRequests(companyId: string) {
    return this.prisma.changeRequest.findMany({
      where: { company_id: companyId },
      include: {
        raised_by: true,
        tickets: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateChangeStatus(companyId: string, id: string, status: string, cabNotes?: string) {
    await this.getCompanyChangeRequest(companyId, id);

    return this.prisma.changeRequest.update({
      where: { id },
      data: { 
        status,
        cab_notes: cabNotes,
        implemented_at: status === 'implemented' ? new Date() : undefined
      }
    });
  }

  // --- IT Assets ---

  async createAsset(companyId: string, data: CreateAssetDto) {
    return this.prisma.iTAsset.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getAssets(companyId: string) {
    return this.prisma.iTAsset.findMany({
      where: { company_id: companyId },
      include: {
        assigned_to: true
      },
      orderBy: { asset_tag: 'asc' }
    });
  }

  // --- Knowledge Base ---

  async createKnowledgeArticle(companyId: string, userId: string, data: CreateKnowledgeArticleDto) {
    return this.prisma.knowledgeArticle.create({
      data: {
        ...data,
        company_id: companyId,
        author_id: userId
      }
    });
  }

  async getKnowledgeArticles(companyId: string) {
    return this.prisma.knowledgeArticle.findMany({
      where: { company_id: companyId },
      include: {
        author: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async searchKnowledgeArticles(companyId: string, query: string) {
    return this.prisma.knowledgeArticle.findMany({
      where: {
        company_id: companyId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        author: true
      }
    });
  }

  // --- Reports ---

  async getSlaCompliance(companyId: string) {
    const totalResolved = await this.prisma.iTTicket.count({
      where: { 
        company_id: companyId,
        status: 'resolved'
      }
    });

    const metSla = await this.prisma.iTTicket.count({
      where: {
        company_id: companyId,
        status: 'resolved',
        resolved_at: {
          lte: this.prisma.iTTicket.fields.sla_deadline
        }
      }
    });

    return {
      total: totalResolved,
      met: metSla,
      complianceRate: totalResolved > 0 ? (metSla / totalResolved) * 100 : 100
    };
  }
}
