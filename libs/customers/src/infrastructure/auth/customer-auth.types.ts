export interface CustomerTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerAuthResult extends CustomerTokens {
  jti: string;
}
