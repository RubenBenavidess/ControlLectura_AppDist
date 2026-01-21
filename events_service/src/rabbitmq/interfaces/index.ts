import { EventType } from './event-type.enum';

export interface OrderItemEvent {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderEvent {
  orderId: string;
  customerId: string;
  eventType: EventType;
  items: OrderItemEvent[];
  shippingAddressJson: string;
  timestamp: number;
}

export interface InventoryResponse {
  orderId: string;
  eventType: EventType;
  timestamp: number;
}
