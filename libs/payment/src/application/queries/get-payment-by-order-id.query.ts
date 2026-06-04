export class GetPaymentByOrderIdQuery {
  constructor(
    public readonly customerId: string,
    public readonly orderId: string,
  ) {}
}
