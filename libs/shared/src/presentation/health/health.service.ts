import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DzService } from "../../infrastructure/persistence/drizzle/module/drizzle.service";
import { Redis } from 'ioredis';
import * as os from 'os';
import {
  HealthDependencyStatus,
  HealthDependencyStatusEnum,
  HealthStatusEnum,
} from './health-status.enum';
import { HealthMetricsResponse } from './interfaces/health.interface';

@Injectable()
export class HealthService {
  constructor(
    private readonly dzService: DzService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  async getHealth(): Promise<HealthMetricsResponse> {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const redisStatus = await this.getRedisStatus();
    const psqlStatus = await this.getPsqlStatus();

    return {
      status:
        psqlStatus === HealthDependencyStatusEnum.UP
          ? HealthStatusEnum.OK
          : HealthStatusEnum.DEGRADED,
      uptimeSec: process.uptime(),
      platform: os.platform(),
      cpu: {
        userMicros: cpuUsage.user,
        systemMicros: cpuUsage.system,
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      redis: {
        status: redisStatus,
      },
      psql: {
        status: psqlStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async getRedisStatus(): Promise<HealthDependencyStatus> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG'
        ? HealthDependencyStatusEnum.UP
        : HealthDependencyStatusEnum.DOWN;
    } catch {
      return HealthDependencyStatusEnum.DOWN;
    }
  }

  private async getPsqlStatus(): Promise<HealthDependencyStatus> {
    try {
      await this.dzService.getDb().execute(sql`select 1`);
      return HealthDependencyStatusEnum.UP;
    } catch {
      return HealthDependencyStatusEnum.DOWN;
    }
  }
}
