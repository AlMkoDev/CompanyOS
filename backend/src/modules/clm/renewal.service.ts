import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RenewalService {
  private readonly logger = new Logger(RenewalService.name);

  constructor(private prisma: PrismaService) {}

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleRenewalAlerts() {
    this.logger.log('Running daily contract renewal check...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let expiringContracts;

    try {
      expiringContracts = await this.prisma.contract.findMany({
        where: {
          status: 'signed',
          end_date: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
        },
        include: { owner: true },
      });
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        this.logger.warn('Skipping contract renewal check because CLM tables are not ready yet.');
        return;
      }

      throw error;
    }

    for (const contract of expiringContracts) {
      this.logger.log(`Alert: Contract "${contract.title}" is expiring on ${contract.end_date?.toLocaleDateString()}`);
      // In a real app, send email/notification here
      // await this.notificationService.notify(contract.owner_id, ...);
    }

    this.logger.log(`Found ${expiringContracts.length} contracts expiring within 30 days.`);
  }
}
