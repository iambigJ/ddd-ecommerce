export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasherPort {
  hash(value: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}
