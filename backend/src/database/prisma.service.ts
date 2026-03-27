import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function buildDatasourceUrl() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1');
    }
    return url.toString();
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return rawUrl.includes('connection_limit=')
      ? rawUrl
      : `${rawUrl}${separator}connection_limit=1`;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: buildDatasourceUrl(),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
