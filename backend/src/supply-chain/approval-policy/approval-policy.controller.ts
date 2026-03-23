import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApprovalPolicyService, CreateApprovalPolicyDto } from './approval-policy.service';

// Mocked user decorator for company scoping until proper auth is hooked
const currentCompanyId = 'dummy-company-id';

@Controller('supply-chain/approval-policies')
export class ApprovalPolicyController {
  constructor(private readonly approvalPolicyService: ApprovalPolicyService) {}

  @Post()
  create(@Body() createApprovalPolicyDto: CreateApprovalPolicyDto) {
    return this.approvalPolicyService.create(currentCompanyId, createApprovalPolicyDto);
  }

  @Get()
  findAll() {
    return this.approvalPolicyService.findAll(currentCompanyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalPolicyService.findOne(currentCompanyId, id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateApprovalPolicyDto>,
  ) {
    return this.approvalPolicyService.update(currentCompanyId, id, updateData);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalPolicyService.remove(currentCompanyId, id);
  }
}
