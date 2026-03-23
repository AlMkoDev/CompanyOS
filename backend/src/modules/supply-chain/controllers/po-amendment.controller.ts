import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { SupplyChainRolesGuard } from '../guards/supply-chain-roles.guard';
import { POModificationLockGuard } from '../guards/po-modification-lock.guard';
import { POAmendmentService, CreateAmendmentDto, ApproveAmendmentDto } from '../services/po-amendment.service';
import { CancelAmendmentDto } from '../dto/po-workflow.dto';

@ApiTags('PO Amendments')
@ApiBearerAuth()
@Controller('supply-chain/po-amendments')
@UseGuards(JwtAuthGuard, SupplyChainRolesGuard)
export class POAmendmentController {
  private readonly logger = new Logger(POAmendmentController.name);

  constructor(private readonly amendmentService: POAmendmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create PO amendment request' })
  @ApiResponse({ status: 201, description: 'Amendment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'PO cannot be amended in current status' })
  @UseGuards(POModificationLockGuard)
  async createAmendment(
    @Request() req: any,
    @Body() createAmendmentDto: CreateAmendmentDto,
  ) {
    const { user } = req;
    
    this.logger.log(`Creating amendment for PO ${createAmendmentDto.poId} by user ${user.id}`);

    return this.amendmentService.createAmendment(
      user.companyId,
      user.id,
      createAmendmentDto,
    );
  }

  @Put(':amendmentId/approve')
  @ApiOperation({ summary: 'Approve or reject PO amendment' })
  @ApiResponse({ status: 200, description: 'Amendment processed successfully' })
  @ApiResponse({ status: 400, description: 'Amendment not found or already processed' })
  async approveAmendment(
    @Request() req: any,
    @Param('amendmentId') amendmentId: string,
    @Body() approveDto: ApproveAmendmentDto,
  ) {
    const { user } = req;
    
    this.logger.log(`Processing amendment ${amendmentId} by user ${user.id}: ${approveDto.approved ? 'APPROVED' : 'REJECTED'}`);

    return this.amendmentService.approveAmendment(
      user.companyId,
      amendmentId,
      user.id,
      approveDto,
    );
  }

  @Put(':amendmentId/apply')
  @ApiOperation({ summary: 'Apply approved amendment to PO' })
  @ApiResponse({ status: 200, description: 'Amendment applied successfully' })
  @ApiResponse({ status: 400, description: 'Amendment not approved or already applied' })
  async applyAmendment(
    @Request() req: any,
    @Param('amendmentId') amendmentId: string,
  ) {
    const { user } = req;
    
    this.logger.log(`Applying amendment ${amendmentId} by user ${user.id}`);

    return this.amendmentService.applyAmendment(
      user.companyId,
      amendmentId,
      user.id,
    );
  }

  @Put(':amendmentId/cancel')
  @ApiOperation({ summary: 'Cancel pending amendment' })
  @ApiResponse({ status: 200, description: 'Amendment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Only pending amendments can be cancelled' })
  async cancelAmendment(
    @Request() req: any,
    @Param('amendmentId') amendmentId: string,
    @Body() body: CancelAmendmentDto,
  ) {
    const { user } = req;
    
    this.logger.log(`Cancelling amendment ${amendmentId} by user ${user.id}`);

    return this.amendmentService.cancelAmendment(
      user.companyId,
      amendmentId,
      user.id,
      body.reason,
    );
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending amendments for approval' })
  @ApiResponse({ status: 200, description: 'Pending amendments retrieved successfully' })
  async getPendingAmendments(@Request() req: any) {
    const { user } = req;
    
    return this.amendmentService.getPendingAmendments(user.companyId);
  }

  @Get('po/:poId/history')
  @ApiOperation({ summary: 'Get amendment history for a PO' })
  @ApiResponse({ status: 200, description: 'Amendment history retrieved successfully' })
  async getAmendmentHistory(
    @Request() req: any,
    @Param('poId') poId: string,
  ) {
    const { user } = req;
    
    return this.amendmentService.getAmendmentHistory(user.companyId, poId);
  }

  @Get(':amendmentId')
  @ApiOperation({ summary: 'Get amendment details' })
  @ApiResponse({ status: 200, description: 'Amendment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Amendment not found' })
  async getAmendmentDetails(
    @Request() req: any,
    @Param('amendmentId') amendmentId: string,
  ) {
    const { user } = req;
    
    const amendment = await this.amendmentService.getAmendmentDetails(
      user.companyId,
      amendmentId,
    );

    if (!amendment) {
      return { error: 'Amendment not found' };
    }

    return amendment;
  }

  @Get('po/:poId/lock-status')
  @ApiOperation({ summary: 'Check PO modification lock status' })
  @ApiResponse({ status: 200, description: 'Lock status retrieved successfully' })
  async getPOLockStatus(
    @Request() req: any,
    @Param('poId') poId: string,
  ) {
    const { user } = req;
    
    return this.amendmentService.getPOLockStatus(user.companyId, poId);
  }

  @Get()
  @ApiOperation({ summary: 'Get amendments with filtering' })
  @ApiResponse({ status: 200, description: 'Amendments retrieved successfully' })
  async getAmendments(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('poId') poId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const { user } = req;
    
    return this.amendmentService.getAmendments(user.companyId, {
      status,
      poId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }
}
