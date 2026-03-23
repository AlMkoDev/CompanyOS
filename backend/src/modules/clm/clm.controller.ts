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
import { ClmService } from './clm.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateContractDto,
  CreateContractTemplateDto,
  DecideContractApprovalDto,
  GenerateContractFromTemplateDto,
  SignContractDto,
  SubmitContractApprovalDto,
} from './dto/clm.dto';

@Controller('clm')
@UseGuards(JwtAuthGuard)
export class ClmController {
  constructor(private readonly clmService: ClmService) {}

  // --- Templates ---
  @Post('templates')
  async createTemplate(@Req() req: any, @Body() data: CreateContractTemplateDto) {
    return this.clmService.createTemplate(req.user.companyId, data);
  }

  @Get('templates')
  async getTemplates(@Req() req: any) {
    return this.clmService.getTemplates(req.user.companyId);
  }

  @Get('templates/:id')
  async getTemplate(@Req() req: any, @Param('id') id: string) {
    return this.clmService.getTemplate(req.user.companyId, id);
  }

  // --- Contracts ---
  @Post('contracts')
  async createContract(@Req() req: any, @Body() data: CreateContractDto) {
    return this.clmService.createContract(req.user.companyId, req.user.userId, data);
  }

  @Post('contracts/generate')
  async generateFromTemplate(
    @Req() req: any,
    @Body() body: GenerateContractFromTemplateDto,
  ) {
    return this.clmService.generateFromTemplate(
      req.user.companyId,
      req.user.userId,
      body.templateId,
      body.variables,
    );
  }

  @Get('contracts')
  async getContracts(@Req() req: any) {
    return this.clmService.getContracts(req.user.companyId);
  }

  @Get('contracts/:id')
  async getContract(@Req() req: any, @Param('id') id: string) {
    return this.clmService.getContract(req.user.companyId, id);
  }

  // --- Approvals ---
  @Post('contracts/:id/submit-approval')
  async submitForApproval(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SubmitContractApprovalDto,
  ) {
    return this.clmService.submitForApproval(req.user.companyId, req.user.userId, id, body.approverIds);
  }

  @Post('approvals/:id/decide')
  async decideApproval(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: DecideContractApprovalDto,
  ) {
    return this.clmService.decideApproval(req.user.companyId, req.user.userId, id, body.decision, body.comment);
  }

  // --- Signatures ---
  @Post('contracts/:id/sign')
  async signContract(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SignContractDto,
  ) {
    return this.clmService.signContract(req.user.companyId, req.user.userId, id, body);
  }
}
