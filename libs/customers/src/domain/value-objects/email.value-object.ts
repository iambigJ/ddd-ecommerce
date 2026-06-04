import { HttpStatus } from '@nestjs/common';
import { CError } from '@ddd-ecommerce/shared';

export class Email {
  private readonly value: string;

  constructor(value: string) {
    const normalizedValue = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedValue)) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'customers.invalidEmail',
      });
    }

    this.value = normalizedValue;
  }

  getValue(): string {
    return this.value;
  }
}
