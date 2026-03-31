import { NotFoundException } from "@nestjs/common";
import { Mocked, TestBed } from "@suites/unit";
import { ProductRepository } from "@/infra/repositories/product.repository";
import { ExampleService } from "../services/example.service";

describe("ExampleService", () => {
  let service: ExampleService;
  let productRepository: Mocked<ProductRepository>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(ExampleService).compile();

    service = unit;
    productRepository = unitRef.get(ProductRepository);
  });

  it("should create a product", async () => {
    const createProductResult = { name: "Test Product" };

    await service.createProduct(createProductResult);

    expect(productRepository.create).toHaveBeenCalledWith({
      ...createProductResult,
      externalId: expect.any(String),
    });
  });

  it("should update a product", async () => {
    const hashId = "someHashId";
    const updateProductResult = { name: "Updated Product" };

    productRepository.findByHashId.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Old Product",
      externalId: hashId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await service.updateProduct(hashId, updateProductResult);

    expect(productRepository.update).toHaveBeenCalledWith(hashId, updateProductResult);
  });

  it("should throw an error when updating a non-existing product", async () => {
    const hashId = "nonExistingHashId";
    const updateProductResult = { name: "Updated Product" };

    productRepository.findByHashId.mockResolvedValue(undefined);

    await expect(service.updateProduct(hashId, updateProductResult)).rejects.toThrow(
      NotFoundException,
    );

    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it("should delete a product", async () => {
    const hashId = "someHashId";

    productRepository.findByHashId.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Product to be deleted",
      externalId: hashId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await service.deleteProduct(hashId);

    expect(productRepository.delete).toHaveBeenCalledWith(hashId);
  });

  it("should throw an error when deleting a non-existing product", async () => {
    const hashId = "nonExistingHashId";

    productRepository.findByHashId.mockResolvedValue(undefined);

    await expect(service.deleteProduct(hashId)).rejects.toThrow(NotFoundException);

    expect(productRepository.delete).not.toHaveBeenCalled();
  });
});
