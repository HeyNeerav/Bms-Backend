export function maskEmail(email: string | null | undefined): string {
  if (!email) {
    return "";
  }
  const lastAtIndex = email.lastIndexOf("@");
  if (lastAtIndex <= 0 || lastAtIndex === email.length - 1) {
    return "";
  }

  const localPart = email.slice(0, lastAtIndex);
  const domain = email.slice(lastAtIndex + 1);

  const len = localPart.length;
  let maskedLocal = "";

  if (len <= 2) {
    maskedLocal = localPart.charAt(0) + "*".repeat(len - 1);
  } else if (len <= 5) {
    maskedLocal =
      localPart.charAt(0) + "*".repeat(len - 2) + localPart.charAt(len - 1);
  } else {
    maskedLocal = localPart.slice(0, 2) + "***" + localPart.charAt(len - 1);
  }

  return `${maskedLocal}@${domain}`;
}
