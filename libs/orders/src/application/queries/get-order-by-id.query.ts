export class GetOrderByIdQuery {
  constructor(
    public readonly customerId: string,
    public readonly orderId: string,
  ) {}
}
