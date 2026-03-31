import { Module } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ProductRepository } from "./product.repository";

@Module({
  providers: [PrismaService, ProductRepository],
  exports: [PrismaService, ProductRepository],
})
export class RepositoryModule {}
