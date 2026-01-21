export class StockRejectedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  reason: string;
  rejectedAt: string;

  constructor(orderId: string, correlationId: string, reason: string) {
    this.eventType = 'StockRejected';
    this.orderId = orderId;
    this.correlationId = correlationId;
    this.reason = reason;
    this.rejectedAt = new Date().toISOString();
  }
}
