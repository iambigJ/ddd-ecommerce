export function phoneNormalizer(
  phoneNumber: string,
  prefix = 98,
): string {
  console.log(phoneNumber);

  if (!phoneNumber) return '';
  if (prefix == 98) {
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0098')) {
      phoneNumber = phoneNumber.replace(/^0098/, '98');
    } else if (phoneNumber.startsWith('+98')) {
      phoneNumber = phoneNumber.replace(/^\+98/, '98');
    } else if (phoneNumber.startsWith('0')) {
      phoneNumber = phoneNumber.replace(/^0/, '98');
    } else if ((phoneNumber.startsWith('9'), !phoneNumber.startsWith('98'))) {
      phoneNumber = `98${phoneNumber}`;
    }

    console.log(phoneNumber);

    return phoneNumber;
  } else if (prefix == 0) {
    if (phoneNumber.startsWith('98')) {
      return phoneNumber.replace(/^98/, '0');
    } else if (phoneNumber.startsWith('+98')) {
      return phoneNumber.replace(/^\+98/, '0');
    } else if (phoneNumber.startsWith('0')) {
      return phoneNumber;
    } else if (phoneNumber.startsWith('9')) {
      return '0' + phoneNumber;
    }
    return phoneNumber;
  } else {
    throw new Error('Invalid prefix');
  }
}
