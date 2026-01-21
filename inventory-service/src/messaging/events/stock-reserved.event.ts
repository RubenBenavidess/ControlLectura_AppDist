import { OrderItemEvent } from './order-item.event';

export class StockReservedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  items: OrderItemEvent[]; // Changed from reservedItems to items to match Spring Boot OrderEvent
  timestamp: number; // Changed from reservedAt to timestamp to match Spring Boot OrderEvent

  constructor(
    orderId: string,
    correlationId: string,
    items: OrderItemEvent[],
  ) {
    this.eventType = 'STOCK_RESERVED'; // Must match Spring Boot EventType enum value
    this.orderId = orderId;
    this.correlationId = correlationId;
    this.items = items;
    this.timestamp = Date.now(); // timestamp in milliseconds to match Spring Boot
  }
}
