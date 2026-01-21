export interface IOrderItem {
  productId: string;
  quantity: number;
}

export interface IOrderCreatedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  createdAt: string;
  items: IOrderItem[];
}

export interface IStockReservedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  reservedItems: IOrderItem[];
  reservedAt: string;
}

export interface IStockRejectedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  reason: string;
  rejectedAt: string;
}
