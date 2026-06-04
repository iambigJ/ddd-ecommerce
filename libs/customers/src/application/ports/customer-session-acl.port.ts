

export interface CustomerSessionAclPort {
  resolveCustomerIdByJti(jti: string): Promise<string | null>;
}
