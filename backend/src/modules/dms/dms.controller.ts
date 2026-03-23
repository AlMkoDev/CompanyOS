import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DmsService } from './dms.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  AddDocumentVersionDto,
  CreateFolderDto,
  ToggleLegalHoldDto,
  UploadDocumentDto,
} from './dto/dms.dto';

@Controller('dms')
@UseGuards(JwtAuthGuard)
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Post('folders')
  async createFolder(@Req() req: any, @Body() data: CreateFolderDto) {
    return this.dmsService.createFolder(req.user.companyId, data);
  }

  @Get('explorer')
  async getExplorerRoot(@Req() req: any) {
    return this.dmsService.getExplorer(req.user.companyId);
  }

  @Get('explorer/:folderId')
  async getExplorerFolder(@Req() req: any, @Param('folderId') folderId: string) {
    return this.dmsService.getExplorer(req.user.companyId, folderId);
  }

  @Post('documents')
  async uploadDocument(@Req() req: any, @Body() data: UploadDocumentDto) {
    return this.dmsService.uploadDocument(req.user.companyId, req.user.userId, data);
  }

  @Get('documents/:id')
  async getDocumentDetail(@Req() req: any, @Param('id') id: string) {
    return this.dmsService.getDocumentDetail(req.user.companyId, id);
  }

  @Post('documents/:id/versions')
  async addVersion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: AddDocumentVersionDto,
  ) {
    return this.dmsService.addVersion(
      req.user.companyId,
      id,
      body.fileUrl,
      req.user.userId,
      body.changeLog,
    );
  }

  @Post('documents/:id/legal-hold')
  async toggleLegalHold(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ToggleLegalHoldDto,
  ) {
    return this.dmsService.toggleLegalHold(req.user.companyId, id, req.user.userId, body.reason);
  }

  @Post('documents/:id/delete')
  async deleteDocument(@Req() req: any, @Param('id') id: string) {
    return this.dmsService.deleteDocument(req.user.companyId, id);
  }
}
