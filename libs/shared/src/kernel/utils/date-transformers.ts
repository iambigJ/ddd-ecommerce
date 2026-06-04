function normalizeDigits(s: string): string {
  // Persian ۰-۹ and Arabic ٠-٩ -> ASCII 0-9
  const map: Record<string, string> = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };
  return s.replace(/[۰-۹٠-٩]/g, (d) => map[d] ?? d);
}

export function jalaliToGregorianIso(jalali: string): { iso: string } {
  const cleaned = normalizeDigits(jalali)
    .trim()
    .replace(/[/.]/g, '-')
    .replace(/\s+/g, '');
  const m = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned);
  if (!m) {
    throw new Error(
      `Invalid Jalali date format: "${jalali}". Expected YYYY-MM-DD.`,
    );
  }
  const jy = parseInt(m[1], 10);
  const jm = parseInt(m[2], 10);
  const jd = parseInt(m[3], 10);

  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) {
    throw new Error(`Invalid Jalali month/day: ${jm}-${jd}.`);
  }

  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  if (![gy, gm, gd].every(Number.isFinite)) {
    throw new Error('Conversion failed.');
  }

  const iso = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
  return { iso };
}

export function gregorianIsoToJalali(gregorian: string): string {
  const cleaned = normalizeDigits(gregorian)
    .trim()
    .replace(/[/.]/g, '-')
    .replace(/\s+/g, '');
  const m = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned);
  if (!m) {
    throw new Error(
      `Invalid Gregorian date format: "${gregorian}". Expected YYYY-MM-DD.`,
    );
  }
  const gy = parseInt(m[1], 10);
  const gm = parseInt(m[2], 10);
  const gd = parseInt(m[3], 10);

  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) {
    throw new Error(`Invalid Gregorian month/day: ${gm}-${gd}.`);
  }

  const { jy, jm, jd } = toJalaali(gy, gm, gd);
  if (![jy, jm, jd].every(Number.isFinite)) {
    throw new Error('Conversion failed.');
  }

  return `${jy}${String(jm).padStart(2, '0')}${String(jd).padStart(2, '0')}`;
}

function div(a: number, b: number): number {
  return ~~(a / b);
}

function toGregorian(jy: number, jm: number, jd: number): {
  gy: number;
  gm: number;
  gd: number;
} {
  jy += 1595;
  let days =
    -355668 +
    365 * jy +
    div(jy, 33) * 8 +
    div((jy % 33) + 3, 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * div(days, 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const salA = [
    0,
    31,
    isLeapGregorian(gy) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 1; gm <= 12 && gd > salA[gm]; gm++) gd -= salA[gm];

  return { gy, gm, gd };
}

function toJalaali(gy: number, gm: number, gd: number): {
  jy: number;
  jm: number;
  jd: number;
} {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) +
    gd +
    gdm[gm - 1];
  let jy = -1595 + 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { jy, jm, jd };
}

function isLeapGregorian(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
