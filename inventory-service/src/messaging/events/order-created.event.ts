import { OrderItemEvent } from './order-item.event';

export class OrderCreatedEvent {
  orderId: string;
  customerId: string;
  eventType: string;
  items: OrderItemEvent[];
  shippingAddressJson?: string;
  timestamp?: number;
  correlationId?: string;
  createdAt?: string;

  constructor(
    orderId: string,
    customerId: string,
    items: OrderItemEvent[],
    correlationId?: string,
    createdAt?: string,
    shippingAddressJson?: string,
    timestamp?: number,
  ) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.eventType = 'ORDER_CREATED';
    this.items = items;
    this.correlationId = correlationId || orderId;
    this.createdAt = createdAt;
    this.shippingAddressJson = shippingAddressJson;
    this.timestamp = timestamp;
  }
}
