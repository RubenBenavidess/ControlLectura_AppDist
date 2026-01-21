import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { StockReservedEvent } from '../messaging/events/stock-reserved.event';
import { StockRejectedEvent } from '../messaging/events/stock-rejected.event';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly INVENTORY_RESPONSE_EXCHANGE = 'inventory.response.exchange';
  private readonly STOCK_RESERVED_ROUTING_KEY = 'stock.reserved';
  private readonly STOCK_REJECTED_ROUTING_KEY = 'stock.rejected';

  async onModuleInit() {
    try {
      const rmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
      // Conectar a RabbitMQ
      this.connection = await amqp.connect(rmqUrl);
      this.channel = await this.connection.createChannel();

      // Asegurar que el exchange existe (debe coincidir con la configuración de Spring Boot)
      await this.channel.assertExchange(
        this.INVENTORY_RESPONSE_EXCHANGE,
        'topic',
        {
          durable: true,
        },
      );

      this.logger.log('RabbitMQ client conectado para publicación de eventos');
      this.logger.log(`Exchange: ${this.INVENTORY_RESPONSE_EXCHANGE}`);
    } catch (error) {
      this.logger.error('Error al conectar con RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Publica un evento StockReserved al exchange de respuesta
   * Este evento será enrutado por RabbitMQ usando el routing key 'stock.reserved'
   */
  async publishStockReserved(event: StockReservedEvent): Promise<void> {
    try {
      this.logger.log(
        `Publicando StockReserved: OrderId=${event.orderId}, CorrelationId=${event.correlationId}`,
      );

      // Convertir el evento a JSON
      const message = JSON.stringify(event);

      // Publicar al exchange con el routing key apropiado
      const published = this.channel.publish(
        this.INVENTORY_RESPONSE_EXCHANGE,
        this.STOCK_RESERVED_ROUTING_KEY,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          // Headers que Spring Boot puede usar
          headers: {
            '__TypeId__': 'com.espe.gestion_productos.messagin.OrderEvent',
          },
        },
      );

      if (published) {
        this.logger.log(
          `StockReserved publicado exitosamente para orden ${event.orderId}`,
        );
      } else {
        this.logger.warn(
          `StockReserved no pudo ser publicado inmediatamente (buffer lleno) para orden ${event.orderId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al publicar StockReserved:`, error);
      throw error;
    }
  }

  /**
   * Publica un evento StockRejected al exchange de respuesta
   * Este evento será enrutado por RabbitMQ usando el routing key 'stock.rejected'
   */
  async publishStockRejected(event: StockRejectedEvent): Promise<void> {
    try {
      this.logger.log(
        `Publicando StockRejected: OrderId=${event.orderId}, CorrelationId=${event.correlationId}, Reason=${event.reason}`,
      );

      // Convertir el evento a JSON
      const message = JSON.stringify(event);

      // Publicar al exchange con el routing key apropiado
      const published = this.channel.publish(
        this.INVENTORY_RESPONSE_EXCHANGE,
        this.STOCK_REJECTED_ROUTING_KEY,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          // Headers que Spring Boot puede usar
          headers: {
            '__TypeId__': 'com.espe.gestion_productos.messagin.OrderEvent',
          },
        },
      );

      if (published) {
        this.logger.log(
          `StockRejected publicado exitosamente para orden ${event.orderId}`,
        );
      } else {
        this.logger.warn(
          `StockRejected no pudo ser publicado inmediatamente (buffer lleno) para orden ${event.orderId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al publicar StockRejected:`, error);
      throw error;
    }
  }

  /**
   * Cierra la conexión del cliente
   */
  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ client desconectado');
    } catch (error) {
      this.logger.error('Error al cerrar conexión RabbitMQ:', error);
    }
  }
}
