export class GetPaymentByIdQuery {
  constructor(
    public readonly customerId: string,
    public readonly paymentId: string,
  ) {}
}
