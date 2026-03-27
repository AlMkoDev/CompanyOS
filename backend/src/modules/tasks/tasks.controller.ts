import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';

class AddTaskCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  comment: string;
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() data: CreateTaskDto,
  ) {
    return this.tasksService.create(companyId, userId, data);
  }

  @Get()
  async findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.tasksService.findAll(companyId, departmentId);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(companyId, userId, id, body.status);
  }

  @Post(':id/comments')
  async addComment(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: AddTaskCommentDto,
  ) {
    return this.tasksService.addComment(companyId, userId, id, body.comment);
  }
}
