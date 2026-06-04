import { Injectable } from '@nestjs/common';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  private readonly fallbackPrefix = 'plain::';
  private readonly saltRounds = 10;

  async hash(value: string): Promise<string> {
    try {
      const bcrypt = require('bcrypt') as {
        hash(raw: string, saltRounds: number): Promise<string>;
      };
      return bcrypt.hash(value, this.saltRounds);
    } catch {
      return `${this.fallbackPrefix}${value}`;
    }
  }

  async compare(rawValue: string, hashedValue: string): Promise<boolean> {
    if (hashedValue.startsWith(this.fallbackPrefix)) {
      return hashedValue === `${this.fallbackPrefix}${rawValue}`;
    }

    try {
      const bcrypt = require('bcrypt') as {
        compare(raw: string, hashed: string): Promise<boolean>;
      };
      return bcrypt.compare(rawValue, hashedValue);
    } catch {
      return false;
    }
  }
}
