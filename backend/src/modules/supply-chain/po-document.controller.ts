import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { PODocumentService } from './po-document.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { POModificationLockGuard } from './guards/po-modification-lock.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';
import { getPoDocumentUploadMaxBytes } from '../../common/env';
import { validateUploadedFile } from '../../common/upload-policy';
import { ApprovePODto, SendPOToSupplierDto } from './dto/po-workflow.dto';

@ApiTags('Supply Chain - PO Documents')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/po-documents')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
export class PODocumentController {
  constructor(private readonly poDocumentService: PODocumentService) {}

  @Post(':poId/generate')
  @ApiOperation({ summary: 'Generate PO PDF document' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 201, description: 'PDF generated and uploaded successfully' })
  @ApiResponse({ status: 404, description: 'PO not found' })
  async generatePOPDF(@Req() req: any, @Param('poId') poId: string) {
    return this.poDocumentService.generateAndUploadPOPDF(req.user.companyId, poId, req.user.userId);
  }

  @Post(':poId/acknowledgment')
  @ApiOperation({ summary: 'Generate PO acknowledgment form for supplier' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 201, description: 'Acknowledgment form generated successfully' })
  async generatePOAcknowledgment(@Req() req: any, @Param('poId') poId: string) {
    return this.poDocumentService.generatePOAcknowledgment(req.user.companyId, poId);
  }

  @Put(':poId/approve')
  @UseGuards(POModificationLockGuard)
  @ApiOperation({ summary: 'Approve Purchase Order' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'PO approved successfully' })
  async approvePO(
    @Req() req: any, 
    @Param('poId') poId: string,
    @Body() body: ApprovePODto,
  ) {
    return this.poDocumentService.approvePO(req.user.companyId, poId, req.user.userId, body.comments);
  }

  @Post(':poId/send')
  @UseGuards(POModificationLockGuard)
  @ApiOperation({ summary: 'Send PO to supplier' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'PO sent to supplier successfully' })
  async sendPOToSupplier(
    @Req() req: any, 
    @Param('poId') poId: string,
    @Body() options: SendPOToSupplierDto = {},
  ) {
    return this.poDocumentService.sendPOToSupplier(req.user.companyId, poId, options);
  }

  @Get(':poId/workflow-status')
  @ApiOperation({ summary: 'Get PO workflow status and available actions' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'PO workflow status' })
  async getPOWorkflowStatus(@Req() req: any, @Param('poId') poId: string) {
    return this.poDocumentService.getPOWorkflowStatus(req.user.companyId, poId);
  }

  @Post(':poId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PO document (PDF only)' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or PO not found' })
  async uploadPODocument(
    @Req() req: any,
    @Param('poId') poId: string,
    @UploadedFile() file: any,
  ) {
    const validatedFile = validateUploadedFile(file, {
      allowedMimeTypes: ['application/pdf'],
      allowedExtensions: ['.pdf'],
      maxBytes: getPoDocumentUploadMaxBytes(),
    });

    return this.poDocumentService.uploadPODocument(
      req.user.companyId,
      poId,
      file.buffer,
      validatedFile.sanitizedFileName,
      validatedFile.mimeType,
      req.user.userId,
    );
  }

  @Get(':poId')
  @ApiOperation({ summary: 'Get PO document details and download URL' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'PO document details' })
  @ApiResponse({ status: 404, description: 'PO or document not found' })
  async getPODocument(@Req() req: any, @Param('poId') poId: string) {
    return this.poDocumentService.getPODocument(req.user.companyId, poId);
  }

  @Delete(':poId')
  @UseGuards(POModificationLockGuard)
  @ApiOperation({ summary: 'Delete PO document' })
  @ApiParam({ name: 'poId', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'PO or document not found' })
  async deletePODocument(@Req() req: any, @Param('poId') poId: string) {
    return this.poDocumentService.deletePODocument(req.user.companyId, poId);
  }
}
