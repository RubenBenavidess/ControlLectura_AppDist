import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { StockReservedEvent } from '../messaging/events/stock-reserved.event';
import { StockRejectedEvent } from '../messaging/events/stock-rejected.event';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private client: ClientProxy;

  constructor() {
    // Crear el cliente de RabbitMQ para publicar eventos
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'inventory_to_order_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async onModuleInit() {
    // Conectar el cliente al iniciar el módulo
    await this.client.connect();
    this.logger.log('RabbitMQ client conectado para publicación de eventos');
  }

  /**
   * Publica un evento StockReserved
   */
  async publishStockReserved(event: StockReservedEvent): Promise<void> {
    try {
      this.logger.log(
        `Publicando StockReserved: OrderId=${event.orderId}, CorrelationId=${event.correlationId}`,
      );

      await this.client.emit('stock.reserved', event).toPromise();

      this.logger.log(`StockReserved publicado exitosamente para orden ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Error al publicar StockReserved:`, error);
      throw error;
    }
  }

  /**
   * Publica un evento StockRejected
   */
  async publishStockRejected(event: StockRejectedEvent): Promise<void> {
    try {
      this.logger.log(
        `Publicando StockRejected: OrderId=${event.orderId}, CorrelationId=${event.correlationId}, Reason=${event.reason}`,
      );

      await this.client.emit('stock.rejected', event).toPromise();

      this.logger.log(`StockRejected publicado exitosamente para orden ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Error al publicar StockRejected:`, error);
      throw error;
    }
  }

  /**
   * Cierra la conexión del cliente
   */
  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('RabbitMQ client desconectado');
  }
}
