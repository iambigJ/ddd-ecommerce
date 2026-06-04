export class VerifyOrderOwnershipQuery {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
  ) {}
}
