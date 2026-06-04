export class AppendOrderItemCommand {
  constructor(
    public readonly customerId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
