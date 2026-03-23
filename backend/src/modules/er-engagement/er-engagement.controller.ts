import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ErEngagementService } from './er-engagement.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CreateErCaseDto, CreateErTicketDto } from './dto/er-engagement.dto';

@Controller('er-engagement')
@UseGuards(JwtAuthGuard)
export class ErEngagementController {
  constructor(private readonly erEngagementService: ErEngagementService) {}

  @Post('tickets')
  async createTicket(@Req() req: any, @Body() data: CreateErTicketDto) {
    return this.erEngagementService.createTicket(
      req.user.companyId,
      req.user.userId,
      data,
    );
  }

  @Get('tickets')
  async getTickets(@Req() req: any) {
    return this.erEngagementService.getTickets(req.user.companyId);
  }

  @Post('cases')
  async createCase(@Body() body: CreateErCaseDto) {
    return this.erEngagementService.createCase(body.employeeId, body.data);
  }

  @Get('cases')
  async getCases(@Req() req: any) {
    return this.erEngagementService.getCases(req.user.companyId);
  }
}
