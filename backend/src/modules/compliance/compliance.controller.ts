import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { FileInterceptor } from '@nestjs/platform-express';
import { getComplianceUploadMaxBytes } from '../../common/env';
import { validateUploadedFile } from '../../common/upload-policy';
import {
  CreateComplianceDeadlineDto,
  FileComplianceDeadlineDto,
  UpdateComplianceDeadlineDto,
} from './dto/compliance.dto';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.complianceService.getDashboard(req.user.companyId);
  }

  @Get('calendar')
  async getCalendarData(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.complianceService.getCalendarData(
      req.user.companyId,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('deadlines')
  async getDeadlines(@Request() req: any) {
    return this.complianceService.getDeadlines(req.user.companyId);
  }

  @Get('deadlines/:id')
  async getDeadline(@Request() req: any, @Param('id') id: string) {
    return this.complianceService.getDeadlineById(req.user.companyId, id);
  }

  @Post('deadlines')
  async createDeadline(@Request() req: any, @Body() data: CreateComplianceDeadlineDto) {
    return this.complianceService.createDeadline({
      ...data,
      company_id: req.user.companyId,
      created_by: req.user.userId,
    });
  }

  @Put('deadlines/:id')
  async updateDeadline(
    @Request() req: any,
    @Param('id') id: string,
    @Body() data: UpdateComplianceDeadlineDto,
  ) {
    return this.complianceService.updateDeadline(req.user.companyId, id, data);
  }

  @Post('deadlines/:id/file')
  @UseInterceptors(FileInterceptor('file'))
  async fileDeadline(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req: any,
    @Body() body: FileComplianceDeadlineDto
  ) {
    const validatedFile = file
      ? validateUploadedFile(file, {
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
          maxBytes: getComplianceUploadMaxBytes(),
        })
      : undefined;

    return this.complianceService.fileDeadline(req.user.companyId, id, file, {
      filing_date: body.filing_date,
      reference_no: body.reference_no,
      notes: body.notes,
      userId: req.user.userId,
      ipAddress: req.ip,
      fileName: validatedFile?.sanitizedFileName,
      fileMimeType: validatedFile?.mimeType,
      fileSize: validatedFile?.size,
    });
  }
}
