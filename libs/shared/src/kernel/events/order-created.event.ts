export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
