import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DocumentStorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../database/prisma.service';
import { POPDFGeneratorService } from './po-pdf-generator.service';
import { POStatus } from '@prisma/client';
import { getPoDocumentUploadMaxBytes } from '../../common/env';
import { validateUploadedFile } from '../../common/upload-policy';

@Injectable()
export class PODocumentService {
  private readonly logger = new Logger(PODocumentService.name);

  constructor(
    private storageService: DocumentStorageService,
    private prisma: PrismaService,
    private pdfGenerator: POPDFGeneratorService,
  ) {}

  private async getCompanyPO(companyId: string, poId: string, include?: any, select?: any) {
    const po = await this.prisma.opsPurchaseOrder.findFirst({
      where: { id: poId, company_id: companyId },
      include,
      select,
    });

    if (!po) {
      throw new BadRequestException('Purchase Order not found');
    }

    return po;
  }

  /**
   * Generate and upload PO PDF document
   */
  async generateAndUploadPOPDF(companyId: string, poId: string, userId?: string) {
    this.logger.log(`Generating PDF for PO ${poId}`);

    // Validate PO exists and get details
    const po = await this.getCompanyPO(companyId, poId, { supplier: true });

    // Generate PDF
    const pdfBuffer = await this.pdfGenerator.generatePOPDF(companyId, poId);

    // Upload to S3
    const fileName = `${po.po_number}.pdf`;
    const result = await this.storageService.uploadFile(
      pdfBuffer,
      fileName,
      'application/pdf',
      companyId,
    );

    // Update PO with PDF URL
    const updatedPO = await this.prisma.opsPurchaseOrder.update({
      where: { id: poId },
      data: { 
        pdf_url: result.url,
        status: po.status === POStatus.DRAFT ? POStatus.PENDING_APPROVAL : po.status,
      },
    });

    this.logger.log(`PDF generated and uploaded for PO ${po.po_number}`);

    return {
      po_id: poId,
      po_number: po.po_number,
      file_url: result.url,
      file_key: result.key,
      file_size: pdfBuffer.length,
      generated_at: new Date(),
      status: updatedPO.status,
    };
  }

  /**
   * Generate PO acknowledgment form
   */
  async generatePOAcknowledgment(companyId: string, poId: string) {
    this.logger.log(`Generating acknowledgment form for PO ${poId}`);

    const po = await this.getCompanyPO(companyId, poId);

    // Generate acknowledgment PDF
    const pdfBuffer = await this.pdfGenerator.generatePOAcknowledgment(companyId, poId);

    // Upload to S3
    const fileName = `${po.po_number}-acknowledgment.pdf`;
    const result = await this.storageService.uploadFile(
      pdfBuffer,
      fileName,
      'application/pdf',
      companyId,
    );

    return {
      po_id: poId,
      po_number: po.po_number,
      acknowledgment_url: result.url,
      file_key: result.key,
      generated_at: new Date(),
    };
  }

  /**
   * Send PO to supplier (update status and optionally email)
   */
  async sendPOToSupplier(companyId: string, poId: string, options?: {
    emailSupplier?: boolean;
    includeAcknowledgment?: boolean;
    customMessage?: string;
  }) {
    const po = await this.getCompanyPO(companyId, poId, {
      supplier: true,
      lines: { include: { product: true } },
    });

    if (!po.pdf_url) {
      throw new BadRequestException('PO PDF must be generated before sending');
    }

    // Update PO status to SENT
    const updatedPO = await this.prisma.opsPurchaseOrder.update({
      where: { id: poId },
      data: { 
        status: POStatus.SENT,
        updated_at: new Date(),
      },
    });

    // Generate acknowledgment form if requested
    let acknowledgmentUrl;
    if (options?.includeAcknowledgment) {
      const ackResult = await this.generatePOAcknowledgment(companyId, poId);
      acknowledgmentUrl = ackResult.acknowledgment_url;
    }

    // TODO: Implement email sending to supplier
    if (options?.emailSupplier && po.supplier.contact_info?.email) {
      this.logger.log(`Sending PO ${po.po_number} to supplier ${po.supplier.name}`);
      // Email implementation would go here
    }

    return {
      po_id: poId,
      po_number: po.po_number,
      status: updatedPO.status,
      sent_at: new Date(),
      supplier: {
        name: po.supplier.name,
        email: po.supplier.contact_info?.email,
      },
      pdf_url: po.pdf_url,
      acknowledgment_url,
      message: `PO ${po.po_number} sent to ${po.supplier.name}`,
    };
  }

  /**
   * Approve PO (move from PENDING_APPROVAL to APPROVED)
   */
  async approvePO(companyId: string, poId: string, approverId: string, comments?: string) {
    const po = await this.getCompanyPO(companyId, poId);

    if (po.status !== POStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PO is not in pending approval status');
    }

    const updatedPO = await this.prisma.opsPurchaseOrder.update({
      where: { id: poId },
      data: { status: POStatus.APPROVED },
    });

    this.logger.log(`PO ${po.po_number} approved by ${approverId}`);

    return {
      po_id: poId,
      po_number: po.po_number,
      status: updatedPO.status,
      approved_by: approverId,
      approved_at: new Date(),
      comments,
    };
  }

  async uploadPODocument(
    companyId: string,
    poId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    userId?: string,
  ) {
    // Validate PO exists
    const po = await this.getCompanyPO(companyId, poId);

    const validatedFile = validateUploadedFile(
      {
        buffer: file,
        originalname: fileName,
        mimetype: mimeType,
        size: file.length,
      },
      {
        allowedMimeTypes: ['application/pdf'],
        allowedExtensions: ['.pdf'],
        maxBytes: getPoDocumentUploadMaxBytes(),
      },
    );

    // Upload to S3
    const result = await this.storageService.uploadFile(
      file,
      `PO-${po.po_number}-${validatedFile.sanitizedFileName}`,
      validatedFile.mimeType,
      companyId,
    );

    // Update PO with PDF URL
    await this.prisma.opsPurchaseOrder.update({
      where: { id: poId },
      data: { pdf_url: result.url },
    });

    return {
      po_id: poId,
      file_url: result.url,
      file_key: result.key,
      uploaded_at: new Date(),
    };
  }

  async getPODocument(companyId: string, poId: string) {
    const po = await this.getCompanyPO(
      companyId,
      poId,
      undefined,
      { pdf_url: true, po_number: true, status: true },
    );

    if (!po.pdf_url) {
      return null;
    }

    const key = this.getManagedCompanyFileKey(po.pdf_url, companyId);
    if (key) {
      const presignedUrl = await this.storageService.getPresignedUrl(key);
      return {
        po_number: po.po_number,
        status: po.status,
        pdf_url: po.pdf_url,
        download_url: presignedUrl,
      };
    }

    return {
      po_number: po.po_number,
      status: po.status,
      pdf_url: po.pdf_url,
    };
  }

  async deletePODocument(companyId: string, poId: string) {
    const po = await this.getCompanyPO(companyId, poId, undefined, { pdf_url: true });

    if (!po.pdf_url) {
      throw new BadRequestException('PO document not found');
    }

    const key = this.getManagedCompanyFileKey(po.pdf_url, companyId);
    if (key) {
      await this.storageService.deleteFile(key);
    }

    // Remove URL from PO
    await this.prisma.opsPurchaseOrder.update({
      where: { id: poId },
      data: { pdf_url: null },
    });

    return { message: 'PO document deleted successfully' };
  }

  /**
   * Get PO workflow status and available actions
   */
  async getPOWorkflowStatus(companyId: string, poId: string) {
    const po = await this.getCompanyPO(companyId, poId, {
      supplier: true,
      lines: { include: { product: true } },
    });

    // Determine available actions based on current status
    const availableActions = [];
    
    switch (po.status) {
      case POStatus.DRAFT:
        availableActions.push('generate_pdf', 'edit', 'delete');
        break;
      case POStatus.PENDING_APPROVAL:
        availableActions.push('approve', 'reject', 'view_pdf');
        break;
      case POStatus.APPROVED:
        availableActions.push('send_to_supplier', 'view_pdf', 'generate_acknowledgment');
        break;
      case POStatus.SENT:
        availableActions.push('view_pdf', 'track_delivery', 'amend');
        break;
      case POStatus.PARTIAL:
      case POStatus.FULLY_RECEIVED:
        availableActions.push('view_pdf', 'view_receipts');
        break;
    }

    return {
      po_id: poId,
      po_number: po.po_number,
      status: po.status,
      has_pdf: !!po.pdf_url,
      supplier: po.supplier.name,
      total_value: po.total_value,
      line_count: po.lines.length,
      available_actions: availableActions,
      created_at: po.created_at,
      updated_at: po.updated_at,
    };
  }

  private getManagedCompanyFileKey(url: string, companyId: string) {
    if (!this.storageService.isCompanyOwnedUrl(url, companyId)) {
      return null;
    }

    return this.storageService.extractKeyFromUrl(url);
  }
}
