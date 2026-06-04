import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public-meta-data';
import { HealthService } from './health.service';
import { HealthMetricsResponse } from './interfaces/health.interface';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  getHealth(): Promise<HealthMetricsResponse> {
    return this.healthService.getHealth();
  }
}
