import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AuthGuard } from '../auth/auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('workflows')
@UseGuards(AuthGuard, TenantGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post()
  async createWorkflow(
    @Body() body: { name: string; trigger: string; nodes: any[]; edges: any[] },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.workflowService.createWorkflow(
      businessId,
      body.name,
      body.trigger,
      body.nodes,
      body.edges,
    );
  }

  @Put(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      trigger: string;
      nodes: any[];
      edges: any[];
      isEnabled?: boolean;
    },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.workflowService.updateWorkflow(
      id,
      businessId,
      body.name,
      body.trigger,
      body.nodes,
      body.edges,
      body.isEnabled,
    );
  }

  @Get('business/:businessId')
  async listWorkflows(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.workflowService.listWorkflows(businessId);
  }

  @Get('business/:businessId/metrics')
  async getMetrics(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.workflowService.getWorkflowMetrics(businessId);
  }

  @Get(':id/executions')
  async listExecutions(@Param('id') id: string, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.workflowService.listExecutions(id, businessId);
  }

  @Get('executions/:executionId')
  async getExecutionDetails(
    @Param('executionId') executionId: string,
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    return this.workflowService.getExecutionDetails(executionId, businessId);
  }
}
