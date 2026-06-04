export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: CreateOrderItemInput[],
  ) {}
}
