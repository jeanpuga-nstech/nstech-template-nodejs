import { Injectable } from "@nestjs/common";

import type { Prisma, Product } from "../database/generated/prisma/client";
import { PrismaService } from "../database/prisma.service";

export type NewProduct = Pick<Prisma.ProductCreateInput, "externalId" | "name">;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: Partial<Pick<Product, "name">>) {
    const where: Prisma.ProductWhereInput = {
      ...(filter.name?.trim()
        ? {
            name: {
              contains: filter.name.trim(),
              mode: "insensitive",
            },
          }
        : {}),
    };

    return this.prisma.product.findMany({
      where,
    });
  }

  async findByHashId(hashId: string) {
    return this.prisma.product.findUnique({
      where: { externalId: hashId },
    });
  }

  async create(data: NewProduct) {
    return this.prisma.product.create({ data });
  }

  async update(hashId: string, data: Partial<Pick<Product, "name">>) {
    await this.prisma.product.update({
      where: { externalId: hashId },
      data,
    });
  }

  async delete(hashId: string) {
    await this.prisma.product.delete({
      where: { externalId: hashId },
    });
  }
}
