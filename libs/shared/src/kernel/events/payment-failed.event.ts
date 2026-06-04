export class PaymentFailedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: string,
    public readonly reason: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
