import { HttpStatus } from '@nestjs/common';
import { CError } from '@ddd-ecommerce/shared';

export class PasswordHash {
  private readonly value: string;

  constructor(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'customers.invalidPasswordHash',
      });
    }

    this.value = normalizedValue;
  }

  getValue(): string {
    return this.value;
  }
}
