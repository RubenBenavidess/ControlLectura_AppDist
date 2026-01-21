import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductStock } from './entities/product-stock.entity';
import { ProductStockService } from './product-stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStock])],
  controllers: [ProductsController],
  providers: [ProductStockService],
  exports: [ProductStockService],
})
export class ProductsModule {}
