import { randomUUID } from 'crypto';

export class CustomerId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }

  getValue(): string {
    return this.value;
  }
}
