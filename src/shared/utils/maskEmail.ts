export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) {
    return '';
  }

  const parts = email.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  if (!localPart || !domain) {
    return '';
  }

  const len: number = localPart.length;
  let maskedLocal: string = '';

  if (len <= 2) {
    maskedLocal = localPart.slice(0, 1) + '*'.repeat(len - 1);
  } else if (len <= 5) {
    maskedLocal = localPart.charAt(0) + '*'.repeat(len - 2) + localPart.charAt(len - 1);
  } else {
    maskedLocal = localPart.slice(0, 2) + '***' + localPart.charAt(len - 1);
  }

  return `${maskedLocal}@${domain}`;
}