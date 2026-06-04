export const ORDER_OWNERSHIP = Symbol.for(
  '@ddd-ecommerce/peyment/ORDER_OWNERSHIP',
);

export interface OrderOwnershipPort {
  isOrderOwnedByCustomer(
    orderId: string,
    customerId: string,
  ): Promise<boolean>;
}
