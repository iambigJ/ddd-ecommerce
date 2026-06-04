export enum HealthStatusEnum {
  OK = 'ok',
  DEGRADED = 'degraded',
}

export enum HealthDependencyStatusEnum {
  UP = 'up',
  DOWN = 'down',
}

export type HealthStatus = `${HealthStatusEnum}`;
export type HealthDependencyStatus = `${HealthDependencyStatusEnum}`;
