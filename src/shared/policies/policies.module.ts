import { Module } from "@nestjs/common";
import JwtValidator from "@nstechhub/corporate-auth-policies";
import { EnvModule } from "@/config/env/env.module";
import { EnvService } from "@/config/env/env.service";
import { PoliciesGuard } from "./policies.guard";
import { JWT_VALIDATOR } from "./policies.tokens";

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: JWT_VALIDATOR,
      useFactory: (env: EnvService) => JwtValidator.create({ issuer: env.get("KEYCLOAK_ISSUER") }),
      inject: [EnvService],
    },
    PoliciesGuard,
  ],
  exports: [JWT_VALIDATOR, PoliciesGuard],
})
export class PoliciesModule {}
