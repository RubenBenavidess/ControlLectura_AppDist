import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductStockService } from './product-stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductStockDto } from './dto/create-product-stock.dto';
import { ProductStockResponseDto } from './dto/product-stock-response.dto';

@ApiTags('products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productStockService: ProductStockService,
  ) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  // ============================================
  // ENDPOINTS DE STOCK
  // ============================================

  @Get(':productId/stock')
  @ApiOperation({ summary: 'Consultar stock de un producto' })
  @ApiParam({
    name: 'productId',
    description: 'UUID del producto',
    example: 'a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock del producto obtenido exitosamente',
    type: ProductStockResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async getProductStock(
    @Param('productId') productId: string,
  ): Promise<ProductStockResponseDto> {
    return this.productStockService.getProductStock(productId);
  }

  @Post('stock')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear registro de stock para un producto' })
  @ApiResponse({
    status: 201,
    description: 'Stock creado exitosamente',
    type: ProductStockResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock ya existe',
  })
  async createProductStock(
    @Body() createDto: CreateProductStockDto,
  ): Promise<ProductStockResponseDto> {
    return this.productStockService.createProductStock(createDto);
  }

  @Get('stock/all')
  @ApiOperation({ summary: 'Obtener todos los stocks de productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de stocks obtenida exitosamente',
    type: [ProductStockResponseDto],
  })
  async getAllProductStocks(): Promise<ProductStockResponseDto[]> {
    return this.productStockService.getAllProductStocks();
  }
}
