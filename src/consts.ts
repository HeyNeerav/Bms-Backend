export const VERIFICATION_EMAIL_TEMPLATE_ID =
  "03e8b94c-b7ae-4638-a308-6dcc6c44668f";
export const INVOICE_SENT_EMAIL_TEMPLATE_ID =
  "0898c0db-abe0-49f3-8f82-f377494ed598";


export const BUSINESS_ROLE = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type BusinessRole = (typeof BUSINESS_ROLE)[keyof typeof BUSINESS_ROLE];


export const PRODUCT_TYPE = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
} as const;

export type ProductType = (typeof PRODUCT_TYPE)[keyof typeof PRODUCT_TYPE];


export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const allowedInvoiceSortFields = [
  "createdAt",
  "issuedDate",
  "dueDate",
  "total",
  "invoiceNumber",
];


export const PAYMENT_METHOD = {
  CASH: "CASH",
  UPI: "UPI",
  BANK: "BANK",
  CARD: "CARD",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];


export const PAYMENT_STATUS = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
} as const;

  export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
