import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrderEventDto, InventoryResponseDto } from './dto/event.dto';
import { EventType } from './interfaces/event-type.enum';

@Injectable()
export class RabbitMQService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.logger.log('Connected to RabbitMQ');

      // Setup exchanges and queues
      await this.setupExchanges();
      await this.setupQueues();
      await this.setupBindings();

      // Start consuming messages
      await this.consumeOrderCreatedEvents();
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ', error);
      setTimeout(() => this.initialize(), 5000);
    }
  }

  private async setupExchanges() {
    // Order exchange (for OrderCreated events)
    await this.channel.assertExchange('order.exchange', 'topic', { durable: true });

    // Inventory response exchange (for StockReserved/StockRejected events)
    await this.channel.assertExchange('inventory.response.exchange', 'topic', { durable: true });
  }

  private async setupQueues() {
    // Queue for consuming OrderCreated events
    await this.channel.assertQueue('inventory.order.queue', { durable: true });

    // Queue for publishing inventory responses
    // (Order Service will consume from 'order.inventory.response.queue')
  }

  private async setupBindings() {
    // Bind OrderCreated events
    await this.channel.bindQueue('inventory.order.queue', 'order.exchange', 'order.created');
  }

  async consumeOrderCreatedEvents() {
    try {
      await this.channel.consume('inventory.order.queue', async (msg) => {
        if (msg) {
          try {
            const orderEvent: OrderEventDto = JSON.parse(msg.content.toString());
            this.logger.log(`Received OrderCreated event for orderId: ${orderEvent.orderId}`);

            // Process the order (simulate inventory check)
            await this.processOrderEvent(orderEvent);

            this.channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing order event', error);
            this.channel.nack(msg, false, true);
          }
        }
      });
      this.logger.log('Started consuming OrderCreated events');
    } catch (error) {
      this.logger.error('Error setting up consumer', error);
    }
  }

  private async processOrderEvent(orderEvent: OrderEventDto) {
    try {
      // Simulate inventory validation (in real scenario, check database)
      const hasStock = this.validateStock(orderEvent);

      if (hasStock) {
        await this.publishStockReserved(orderEvent);
      } else {
        await this.publishStockRejected(orderEvent);
      }
    } catch (error) {
      this.logger.error('Error processing inventory validation', error);
      await this.publishStockRejected(orderEvent);
    }
  }

  private validateStock(orderEvent: OrderEventDto): boolean {
    // Simulate stock validation
    // In a real scenario, you would check against a database
    this.logger.log(`Validating stock for orderId: ${orderEvent.orderId}`);

    // For demo purposes, accept all orders with items quantity <= 10
    const allItemsAvailable = orderEvent.items.every((item) => item.quantity <= 10);
    return allItemsAvailable;
  }

  async publishStockReserved(orderEvent: OrderEventDto) {
    try {
      const response: InventoryResponseDto = {
        orderId: orderEvent.orderId,
        eventType: EventType.STOCK_RESERVED,
        timestamp: Date.now(),
      };

      await this.channel.publish(
        'inventory.response.exchange',
        'stock.reserved',
        Buffer.from(JSON.stringify(response)),
        { persistent: true },
      );

      this.logger.log(`Published StockReserved event for orderId: ${orderEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error publishing StockReserved event', error);
    }
  }

  async publishStockRejected(orderEvent: OrderEventDto) {
    try {
      const response: InventoryResponseDto = {
        orderId: orderEvent.orderId,
        eventType: EventType.STOCK_REJECTED,
        timestamp: Date.now(),
      };

      await this.channel.publish(
        'inventory.response.exchange',
        'stock.rejected',
        Buffer.from(JSON.stringify(response)),
        { persistent: true },
      );

      this.logger.log(`Published StockRejected event for orderId: ${orderEvent.orderId}`);
    } catch (error) {
      this.logger.error('Error publishing StockRejected event', error);
    }
  }

  async closeConnection() {
    try {
      await this.channel.close();
      await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }
}
