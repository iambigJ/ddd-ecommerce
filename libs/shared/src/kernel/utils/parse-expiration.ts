export function parseExpirationToSeconds(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 86400;
  const amount = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return amount * multipliers[match[2]];
}
