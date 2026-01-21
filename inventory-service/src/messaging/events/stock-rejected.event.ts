export class StockRejectedEvent {
  eventType: string;
  orderId: string;
  correlationId: string;
  reason: string;
  timestamp: number; // Changed from rejectedAt to timestamp to match Spring Boot OrderEvent

  constructor(orderId: string, correlationId: string, reason: string) {
    this.eventType = 'STOCK_REJECTED'; // Must match Spring Boot EventType enum value
    this.orderId = orderId;
    this.correlationId = correlationId;
    this.reason = reason;
    this.timestamp = Date.now(); // timestamp in milliseconds to match Spring Boot
  }
}
