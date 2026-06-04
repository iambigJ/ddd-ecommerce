import { randomUUID } from 'crypto';

export class SessionJti {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): SessionJti {
    return new SessionJti(randomUUID());
  }

  getValue(): string {
    return this.value;
  }
}
