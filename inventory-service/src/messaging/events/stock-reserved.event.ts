import { OrderItemEvent } from './order-item.event';

export class StockReservedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  reservedItems: OrderItemEvent[];
  reservedAt: string;

  constructor(
    orderId: string,
    correlationId: string,
    reservedItems: OrderItemEvent[],
  ) {
    this.eventType = 'StockReserved';
    this.orderId = orderId;
    this.correlationId = correlationId;
    this.reservedItems = reservedItems;
    this.reservedAt = new Date().toISOString();
  }
}
