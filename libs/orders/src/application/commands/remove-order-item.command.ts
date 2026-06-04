export class RemoveOrderItemCommand {
  constructor(
    public readonly customerId: string,
    public readonly orderId: string,
    public readonly itemId: string,
  ) {}
}
