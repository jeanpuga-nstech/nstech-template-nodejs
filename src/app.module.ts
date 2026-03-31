import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { SentryModule } from "@sentry/nestjs/setup";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { EnvModule } from "./config/env/env.module";
import { validate } from "./config/env/env.validation";
import { HealthModule } from "./health/health.module";
import { MetricController } from "./infra/prometheus/metric.controller";
import { MetricModule } from "./infra/prometheus/metric.module";
import { ExampleModule } from "./modules/example/example.module";
import { AuthModule } from "./shared/auth/auth.module";
import { JwtAuthGuard } from "./shared/auth/jwt-auth.guard";
import { PoliciesGuard } from "./shared/policies/policies.guard";
import { PoliciesModule } from "./shared/policies/policies.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validate,
    }),
    EventEmitterModule.forRoot({
      verboseMemoryLeak: true,
    }),
    PrometheusModule.register({
      controller: MetricController,
    }),
    MetricModule,
    EnvModule,
    AuthModule,
    PoliciesModule,
    HealthModule,
    ExampleModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
})
export class AppModule {}
