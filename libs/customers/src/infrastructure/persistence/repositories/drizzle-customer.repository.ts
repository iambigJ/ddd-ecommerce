import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DzService } from '@ddd-ecommerce/shared';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepositoryPort,
} from '../../../domain/repositories/customer.repository.port';
import { customersTable } from '../data-model/customer.schema';
import { CustomerAggregate } from '../../../domain/aggregates/customer.aggregate';
import { CustomerId } from '../../../domain/value-objects/customer-id.value-object';
import { Email } from '../../../domain/value-objects/email.value-object';
import { PasswordHash } from '../../../domain/value-objects/password-hash.value-object';

@Injectable()
export class DrizzleCustomerRepository implements CustomerRepositoryPort {
  constructor(
    @Inject(DzService)
    private readonly drizzleService: DzService<{
      customersTable: typeof customersTable;
    }>,
  ) {}

  async create(customer: CustomerAggregate): Promise<CustomerAggregate> {
    const db = this.drizzleService.getDb();
    const [createdCustomer] = await db
      .insert(customersTable)
      .values({
        id: customer.getId(),
        name: customer.getName(),
        email: customer.getEmail(),
        passwordHash: customer.getPasswordHash(),
        createdAt: customer.getCreatedAt(),
        updatedAt: customer.getUpdatedAt(),
      })
      .returning();

    return this.toAggregate(createdCustomer);
  }

  async findByEmail(email: string): Promise<CustomerAggregate | null> {
    const db = this.drizzleService.getDb();
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, email))
      .limit(1);

    return customer ? this.toAggregate(customer) : null;
  }

  async findById(id: string): Promise<CustomerAggregate | null> {
    const db = this.drizzleService.getDb();
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .limit(1);

    return customer ? this.toAggregate(customer) : null;
  }

  async update(customer: CustomerAggregate): Promise<CustomerAggregate> {
    const db = this.drizzleService.getDb();
    const [updatedCustomer] = await db
      .update(customersTable)
      .set({
        name: customer.getName(),
        email: customer.getEmail(),
        updatedAt: customer.getUpdatedAt(),
      })
      .where(eq(customersTable.id, customer.getId()))
      .returning();

    return this.toAggregate(updatedCustomer);
  }

  private toAggregate(customer: typeof customersTable.$inferSelect): CustomerAggregate {
    return CustomerAggregate.create({
      id: new CustomerId(customer.id),
      name: customer.name,
      email: new Email(customer.email),
      passwordHash: new PasswordHash(customer.passwordHash),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });
  }
}

export const CustomerRepositoryProvider = {
  provide: CUSTOMER_REPOSITORY,
  useClass: DrizzleCustomerRepository,
};
