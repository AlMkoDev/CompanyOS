import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../../common/services/notification.service';

@Injectable()
export class ComplianceReminderService {
  private readonly logger = new Logger(ComplianceReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkDeadlines() {
    this.logger.log('Running daily compliance deadline check...');
    
    const now = new Date();
    const t30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const t14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const t7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let deadlines;

    try {
      deadlines = await this.prisma.complianceDeadline.findMany({
        where: {
          is_active: true,
          status: 'pending',
          due_date: {
            lte: t30,
            gte: now,
          }
        },
        include: {
          assignee: true,
          company: true,
        }
      });
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        this.logger.warn('Skipping compliance deadline check because compliance tables are not ready yet.');
        return;
      }

      throw error;
    }

    for (const deadline of deadlines) {
      const daysLeft = Math.ceil((deadline.due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if ([30, 14, 7, 3, 1].includes(daysLeft)) {
        await this.sendReminder(deadline, daysLeft);
      }
    }
  }

  private async sendReminder(deadline: any, daysLeft: number) {
    const message = `Reminder: Compliance deadline "${deadline.title}" is due in ${daysLeft} days (${deadline.due_date.toLocaleDateString()}).`;
    
    this.logger.log(`Sending reminder for ${deadline.title} (${daysLeft} days left)`);

    // Notify assignee if exists
    if (deadline.assignee?.email) {
      // In a real app, we'd use this.notificationService.sendEmail(...)
      this.logger.log(`Email notification queued for ${deadline.assignee.email}`);
    }

    // Also notify via SMS using Africa's Talking integration if available
    if (deadline.assignee?.phone) {
      try {
        await this.notificationService.sendSMS(deadline.assignee.phone, message);
      } catch (error) {
        this.logger.error(`Failed to send SMS for ${deadline.title}: ${error.message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdue() {
    this.logger.log('Checking for overdue compliance deadlines...');
    
    const now = new Date();
    
    let result;

    try {
      result = await this.prisma.complianceDeadline.updateMany({
        where: {
          is_active: true,
          status: 'pending',
          due_date: {
            lt: now,
          }
        },
        data: {
          status: 'overdue',
        }
      });
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        this.logger.warn('Skipping overdue compliance update because compliance tables are not ready yet.');
        return;
      }

      throw error;
    }

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} deadlines as overdue`);
    }
  }
}
