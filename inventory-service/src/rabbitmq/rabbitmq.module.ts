import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStock } from '../products/entities/product-stock.entity';
import { ProductStockService } from '../products/product-stock.service';
import { RabbitMQService } from './rabbitmq.service';
import { OrderEventsConsumer } from '../messaging/order-events.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStock])],
  controllers: [OrderEventsConsumer],
  providers: [ProductStockService, RabbitMQService],
  exports: [ProductStockService, RabbitMQService],
})
export class RabbitmqModule {}
