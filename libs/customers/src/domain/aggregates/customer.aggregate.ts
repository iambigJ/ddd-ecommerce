import { HttpStatus } from '@nestjs/common';
import { CError } from '@ddd-ecommerce/shared';
import { CustomerId } from '../value-objects/customer-id.value-object';
import { Email } from '../value-objects/email.value-object';
import { PasswordHash } from '../value-objects/password-hash.value-object';

export interface CustomerAggregateProps {
  id: CustomerId;
  name: string;
  email: Email;
  passwordHash: PasswordHash;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerAggregate {
  private readonly id: CustomerId;
  private name: string;
  private email: Email;
  private passwordHash: PasswordHash;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: CustomerAggregateProps) {
    this.id = props.id;
    this.name = this.validateName(props.name);
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CustomerAggregateProps): CustomerAggregate {
    return new CustomerAggregate(props);
  }

  getId(): string {
    return this.id.getValue();
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email.getValue();
  }

  getPasswordHash(): string {
    return this.passwordHash.getValue();
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  editProfile(payload: { name?: string; email?: Email }): void {
    const hasNameUpdate = payload.name !== undefined;
    const hasEmailUpdate = payload.email !== undefined;

    if (!hasNameUpdate && !hasEmailUpdate) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'customers.emptyPatch',
      });
    }

    if (hasNameUpdate) {
      this.name = this.validateName(payload.name ?? '');
    }

    if (hasEmailUpdate && payload.email) {
      this.email = payload.email;
    }

    this.updatedAt = new Date();
  }

  private validateName(name: string): string {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'customers.invalidName',
      });
    }

    return normalizedName;
  }
}
