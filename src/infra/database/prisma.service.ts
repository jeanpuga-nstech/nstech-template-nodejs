import { Injectable } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { EnvService } from "@/config/env/env.service";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(readonly envService: EnvService) {
    const adapter = new PrismaPg({ connectionString: envService.get("DATABASE_URL") });
    super({ adapter });
  }
}
