import { OrderItemEvent } from './order-item.event';

export class OrderCreatedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  createdAt: string;
  items: OrderItemEvent[];

  constructor(
    orderId: string,
    correlationId: string,
    createdAt: string,
    items: OrderItemEvent[],
  ) {
    this.eventType = 'OrderCreated';
    this.orderId = orderId;
    this.correlationId = correlationId;
    this.createdAt = createdAt;
    this.items = items;
  }
}
