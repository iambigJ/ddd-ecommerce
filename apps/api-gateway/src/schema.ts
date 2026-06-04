import * as customerSchema from '@ddd-ecommerce/customers/infrastructure/persistence/data-model/customer.schema';
import * as productSchema from '@ddd-ecommerce/products/infrustructure/infrastructure/data-model/products.schema';
import * as orderSchema from '@ddd-ecommerce/orders/infrastructure/presistence/data-model/order.schema'
import * as paymentSchema from '@ddd-ecommerce/payment/infrastructure/persistence/data-model/payment.schema';

export const schema = {
  ...customerSchema,
  ...productSchema,
  ...orderSchema,
  ...paymentSchema,
};
