import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateContractDto,
  CreateContractTemplateDto,
  SignContractDto,
} from './dto/clm.dto';

@Injectable()
export class ClmService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyTemplate(companyId: string, templateId: string) {
    const template = await this.prisma.contractTemplate.findFirst({
      where: { id: templateId, company_id: companyId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  private async getCompanyContract(companyId: string, contractId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, company_id: companyId },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  private async getCompanyApproval(companyId: string, approvalId: string) {
    const approval = await this.prisma.contractApproval.findFirst({
      where: {
        id: approvalId,
        contract: {
          company_id: companyId,
        },
      },
      include: { contract: true },
    });
    if (!approval) throw new NotFoundException('Approval request not found');
    return approval;
  }

  // --- Audit Logging ---
  private async logAction(contractId: string | null, userId: string, action: string, details?: any) {
    await this.prisma.auditLog.create({
      data: {
        contract_id: contractId,
        user_id: userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  }

  // --- Templates ---
  async createTemplate(companyId: string, data: CreateContractTemplateDto) {
    return this.prisma.contractTemplate.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getTemplates(companyId: string) {
    return this.prisma.contractTemplate.findMany({
      where: { company_id: companyId, isActive: true },
    });
  }

  async getTemplate(companyId: string, id: string) {
    return this.getCompanyTemplate(companyId, id);
  }

  // --- Contracts ---
  async createContract(companyId: string, userId: string, data: CreateContractDto) {
    const contract = await this.prisma.contract.create({
      data: {
        ...data,
        company_id: companyId,
        owner_id: userId,
        status: 'draft',
      },
    });

    await this.logAction(contract.id, userId, 'create', { title: contract.title });
    return contract;
  }

  async generateFromTemplate(companyId: string, userId: string, templateId: string, variables: any) {
    const template = await this.getCompanyTemplate(companyId, templateId);
    
    // Simulate document generation logic
    let content = template.content;
    Object.keys(variables).forEach(key => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });

    const contract = await this.prisma.contract.create({
      data: {
        company_id: companyId,
        owner_id: userId,
        template_id: templateId,
        title: `${template.title} - ${variables.client_name || 'Generic'}`,
        party_name: variables.client_name || 'TBD',
        category: template.category,
        status: 'draft',
        metadata: variables,
        start_date: new Date(),
      },
    });

    await this.logAction(contract.id, userId, 'generate', { templateId, variables });
    return contract;
  }

  async getContracts(companyId: string) {
    return this.prisma.contract.findMany({
      where: { company_id: companyId },
      include: { 
        owner: true, 
        template: true,
        approvals: { include: { approver: true } },
        signatures: true 
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getContract(companyId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, company_id: companyId },
      include: { 
        owner: true, 
        template: true,
        approvals: { include: { approver: true } },
        signatures: true,
        auditLogs: { include: { user: true }, orderBy: { created_at: 'desc' } }
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  // --- Approvals (Workflow State Machine) ---
  async submitForApproval(companyId: string, userId: string, contractId: string, approverIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findFirst({
        where: { id: contractId, company_id: companyId },
      });
      if (!contract) throw new NotFoundException('Contract not found');

      const approvals = approverIds.map((approver_id, index) => ({
        contract_id: contractId,
        approver_id,
        step: index + 1, // Sequential logic for now
        status: 'pending',
      }));

      await tx.contractApproval.createMany({ data: approvals });
      
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'sent' },
      });

      await this.prisma.auditLog.create({
        data: { contract_id: contractId, user_id: userId, action: 'submit_approval' }
      });

      return { success: true };
    });
  }

  async decideApproval(
    companyId: string,
    userId: string,
    approvalId: string,
    decision: 'approved' | 'rejected',
    comment?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.contractApproval.findFirst({
        where: {
          id: approvalId,
          contract: {
            company_id: companyId,
          },
        },
        include: { contract: true },
      });
      if (!approval) throw new NotFoundException('Approval request not found');

      const updatedApproval = await tx.contractApproval.update({
        where: { id: approvalId },
        data: { status: decision, comment, decided_at: new Date() },
      });

      // Check if all steps are complete if sequential
      const pending = await tx.contractApproval.findFirst({
        where: { contract_id: approval.contract_id, status: 'pending' },
        orderBy: { step: 'asc' }
      });

      if (!pending && decision === 'approved') {
        await tx.contract.update({
          where: { id: approval.contract_id },
          data: { status: 'approved' },
        });
      } else if (decision === 'rejected') {
        await tx.contract.update({
          where: { id: approval.contract_id },
          data: { status: 'draft' }, // Reset to draft on rejection
        });
      }

      await this.prisma.auditLog.create({
        data: { 
          contract_id: approval.contract_id, 
          user_id: userId, 
          action: decision, 
          details: comment 
        }
      });

      return updatedApproval;
    });
  }

  // --- Signatures ---
  async signContract(companyId: string, userId: string, contractId: string, signerDetails: SignContractDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.getCompanyContract(companyId, contractId);

      const signature = await tx.signature.create({
        data: {
          contract_id: contractId,
          signer_name: signerDetails.name,
          signer_email: signerDetails.email,
          ip_address: signerDetails.ip,
          user_agent: signerDetails.userAgent,
          signed_at: new Date(),
        },
      });

      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'signed' },
      });

      await this.prisma.auditLog.create({
        data: { 
          contract_id: contractId, 
          user_id: userId, 
          action: 'sign', 
          details: signerDetails 
        }
      });

      return signature;
    });
  }
}
