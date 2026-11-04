import ENV from "@/env.js";

export const cookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  path: "/",
  sameSite: "lax" as const,
  domain: ENV.NODE_ENV === "production" ? ENV.COOKIE_DOMAIN : undefined,
};

export const PASSWORD_RESET_EMAIL_TEMPLATE_ID = "a6618093-38bc-41f3-878c-7c7763bdfdd8"
export const VERIFICATION_EMAIL_TEMPLATE_ID = "03e8b94c-b7ae-4638-a308-6dcc6c44668f"