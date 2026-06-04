import {
  HealthDependencyStatus,
  HealthStatus,
} from '../health-status.enum';

export interface HealthMetricsResponse {
  status: HealthStatus;
  uptimeSec: number;
  platform: NodeJS.Platform;
  cpu: {
    userMicros: number;
    systemMicros: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  redis: {
    status: HealthDependencyStatus;
  };
  psql: {
    status: HealthDependencyStatus;
  };
  timestamp: string;
}
