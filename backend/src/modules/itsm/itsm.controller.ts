import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ItsmService } from './itsm.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateAssetDto,
  CreateChangeRequestDto,
  CreateKnowledgeArticleDto,
  CreateTicketDto,
  ResolveTicketDto,
  UpdateChangeStatusDto,
} from './dto/itsm.dto';

@Controller('itsm')
@UseGuards(JwtAuthGuard)
export class ItsmController {
  constructor(private readonly itsmService: ItsmService) {}

  // --- Tickets ---

  @Post('tickets')
  async createTicket(@Req() req: any, @Body() data: CreateTicketDto) {
    return this.itsmService.createTicket(
      req.user.companyId,
      req.user.userId,
      data,
    );
  }

  @Get('tickets')
  async getTickets(@Req() req: any) {
    return this.itsmService.getTickets(req.user.companyId);
  }

  @Get('tickets/:id')
  async getTicketById(@Req() req: any, @Param('id') id: string) {
    return this.itsmService.getTicketById(req.user.companyId, id);
  }

  @Patch('tickets/:id/resolve')
  async resolveTicket(@Req() req: any, @Param('id') id: string, @Body() data: ResolveTicketDto) {
    return this.itsmService.resolveTicket(req.user.companyId, id, data.rca);
  }

  // --- Change Requests ---

  @Post('changes')
  async createChangeRequest(@Req() req: any, @Body() data: CreateChangeRequestDto) {
    return this.itsmService.createChangeRequest(
      req.user.companyId,
      req.user.userId,
      data,
    );
  }

  @Get('changes')
  async getChangeRequests(@Req() req: any) {
    return this.itsmService.getChangeRequests(req.user.companyId);
  }

  @Patch('changes/:id/status')
  async updateChangeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateChangeStatusDto,
  ) {
    return this.itsmService.updateChangeStatus(req.user.companyId, id, data.status, data.cabNotes);
  }

  // --- Assets ---

  @Post('assets')
  async createAsset(@Req() req: any, @Body() data: CreateAssetDto) {
    return this.itsmService.createAsset(req.user.companyId, data);
  }

  @Get('assets')
  async getAssets(@Req() req: any) {
    return this.itsmService.getAssets(req.user.companyId);
  }

  // --- Knowledge Base ---

  @Post('knowledge')
  async createKnowledgeArticle(@Req() req: any, @Body() data: CreateKnowledgeArticleDto) {
    return this.itsmService.createKnowledgeArticle(
      req.user.companyId,
      req.user.userId,
      data,
    );
  }

  @Get('knowledge')
  async getKnowledgeArticles(@Req() req: any) {
    return this.itsmService.getKnowledgeArticles(req.user.companyId);
  }

  @Get('knowledge/search')
  async searchKnowledgeArticles(@Req() req: any, @Query('q') q: string) {
    return this.itsmService.searchKnowledgeArticles(req.user.companyId, q);
  }

  // --- Reports ---

  @Get('reports/sla')
  async getSlaCompliance(@Req() req: any) {
    return this.itsmService.getSlaCompliance(req.user.companyId);
  }
}
