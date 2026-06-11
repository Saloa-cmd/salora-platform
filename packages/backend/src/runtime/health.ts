export type RuntimeStatus = "healthy" | "degraded" | "critical";

export type ServiceHealth = {
  name: string;
  status: RuntimeStatus;
  latencyMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
};

export function aggregateStatus(services: ServiceHealth[]): RuntimeStatus {
  if (services.some((service) => service.status === "critical")) {
    return "critical";
  }

  if (services.some((service) => service.status === "degraded")) {
    return "degraded";
  }

  return "healthy";
}
