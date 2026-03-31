import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckResult, HealthCheckService } from "@nestjs/terminus";
import { Public } from "@/shared/decorators/public.decorator";
import { PrismaHealthIndicator } from "./prisma.health";

@Public()
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get("startup")
  @HealthCheck()
  startup(): Promise<HealthCheckResult> {
    return this.health.check([() => Promise.resolve({ self: { status: "up" } })]);
  }

  @Get("live")
  @HealthCheck()
  live(): Promise<HealthCheckResult> {
    return this.health.check([() => Promise.resolve({ self: { status: "up" } })]);
  }

  @Get("ready")
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prismaHealth.isHealthy("database")]);
  }
}
