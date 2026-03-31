import { SetMetadata } from "@nestjs/common";

export interface PolicyMetadata {
  audience: string;
  role?: string;
}

export const POLICIES_KEY = "policies";

export const Policies = (audience: string, role?: string) =>
  SetMetadata<string, PolicyMetadata>(POLICIES_KEY, { audience, role });
