import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  SerializeOptions,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Policies } from "@/shared/policies/policies.decorator";
import { ExampleService } from "../../services/example.service";
import { CreateProductRequestDTO, FindProductsRequestDTO } from "./dto/example-request.dto";
import { FindProductsResponseDTO } from "./dto/example-response.dto";

@ApiTags("example")
@Controller("example")
export class ExampleController {
  constructor(readonly exampleService: ExampleService) {}

  @Get()
  @ApiOperation({ summary: "Busca todos os produtos" })
  @Policies("account", "manage-account")
  @ApiOkResponse({
    type: FindProductsResponseDTO,
    isArray: true,
    description: "Lista de produtos",
  })
  @SerializeOptions({ type: FindProductsResponseDTO })
  async findProducts(@Query() filter: FindProductsRequestDTO) {
    return await this.exampleService.findProducts(filter);
  }

  @Post()
  @ApiOperation({ summary: "Cria um produto" })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() data: CreateProductRequestDTO) {
    await this.exampleService.createProduct(data);
  }

  @Put(":hashId")
  @ApiOperation({ summary: "Atualiza um produto" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateProduct(@Param("hashId") hashId: string, @Body() data: CreateProductRequestDTO) {
    await this.exampleService.updateProduct(hashId, data);
  }

  @Delete(":hashId")
  @ApiOperation({ summary: "Deleta um produto" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param("hashId") hashId: string) {
    await this.exampleService.deleteProduct(hashId);
  }
}
