import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ProductStockService } from '../products/product-stock.service';
import { OrderCreatedEvent } from './events/order-created.event';
import { StockReservedEvent } from './events/stock-reserved.event';
import { StockRejectedEvent } from './events/stock-rejected.event';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Controller()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(
    private readonly productStockService: ProductStockService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() data: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    // Validar que el payload no sea nulo o vacío
    if (!data || !data.orderId) {
      this.logger.warn('Mensaje recibido sin datos válidos o sin orderId');
      // Hacer ACK para evitar reintento
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
      return;
    }

    this.logger.log(`Evento OrderCreated recibido: OrderId=${data.orderId}`);

    try {
      // 1. Validar disponibilidad de stock
      const validation =
        await this.productStockService.validateStockAvailability(data.items);

      if (!validation.isAvailable) {
        // 2a. Si no hay stock, publicar StockRejected
        this.logger.warn(
          `Stock insuficiente para orden ${data.orderId}: ${validation.reason}`,
        );

        const rejectedEvent = new StockRejectedEvent(
          data.orderId,
          data.correlationId || data.orderId,
          validation.reason || 'Stock not available',
        );

        await this.rabbitMQService.publishStockRejected(rejectedEvent);
        this.logger.log(`StockRejected publicado para orden ${data.orderId}`);
      } else {
        // 2b. Si hay stock, reservar y publicar StockReserved
        await this.productStockService.reserveStock(data.items);

        const reservedEvent = new StockReservedEvent(
          data.orderId,
          data.correlationId || data.orderId,
          data.items,
        );

        await this.rabbitMQService.publishStockReserved(reservedEvent);
        this.logger.log(`StockReserved publicado para orden ${data.orderId}`);
      }

      // 3. Hacer ACK del mensaje
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      this.logger.log(
        `Mensaje procesado y confirmado para orden ${data.orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al procesar OrderCreated para orden ${data.orderId}:`,
        error,
      );

      // En caso de error, publicar StockRejected
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const rejectedEvent = new StockRejectedEvent(
        data.orderId,
        data.correlationId || data.orderId,
        `Internal error: ${errorMessage}`,
      );

      await this.rabbitMQService.publishStockRejected(rejectedEvent);

      // Hacer ACK para evitar reintento infinito
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    }
  }
}
