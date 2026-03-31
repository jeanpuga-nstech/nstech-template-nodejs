import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type JwtValidator from "@nstechhub/corporate-auth-policies";
import type { Request } from "express";
import { POLICIES_KEY, type PolicyMetadata } from "./policies.decorator";
import { JWT_VALIDATOR } from "./policies.tokens";

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(JWT_VALIDATOR) private readonly jwtValidator: JwtValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<PolicyMetadata>(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!policy) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        title: "Token não fornecido",
        detail: "O cabeçalho Authorization não foi enviado.",
        externalCode: "SEC-401-001",
      });
    }

    const result = await this.validateAgainstPolicy(authHeader, policy);

    if (!result.success && result.error) {
      const { httpStatus, ...body } = result.error;
      if (httpStatus === 401) throw new UnauthorizedException(body);

      throw new ForbiddenException(body);
    }

    return result.success;
  }

  private async validateAgainstPolicy(authHeader: string, policy: PolicyMetadata) {
    return policy.role
      ? await this.jwtValidator.validateRole(authHeader, policy.audience, policy.role)
      : await this.jwtValidator.validateAudience(authHeader, policy.audience);
  }
}
