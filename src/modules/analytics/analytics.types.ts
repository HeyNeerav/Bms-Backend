import type { Types } from "mongoose";

export type AnalyticsPeriod =
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "year"
  | "lifetime";

export interface AnalyticsOverview {
  totalRevenue: number;
  previousPeriodRevenue: number;
  revenueChange: number | null;
  totalPayments: number;
  averageTransactionValue: number;
  outstandingAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  newClients: number;
  totalProducts: number;
  totalServices: number;
}

export interface RevenueTrendItem {
  date: Date | string;
  revenue: number;
}

export interface InvoiceStatusStat {
  status: string;
  count: number;
  amount: number;
}

export interface TopClient {
  clientId: Types.ObjectId | string;
  name: string;
  revenue: number;
}

export interface TopProduct {
  productId: Types.ObjectId | string | null;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface RecentSale {
  _id: Types.ObjectId | string;
  amount: number;
  method: string;
  paidAt: Date;
  transactionId?: string | undefined;
  invoiceNumber: string;
  clientName: string;
}

export type TrendResult = RevenueTrendItem[];
export type InvoiceStatResult = InvoiceStatusStat[];
export type TopClientResult = TopClient[];
export type TopProductResult = TopProduct[];
export type RecentSaleResult = RecentSale[];

export type RevenueResult = {
  total: number;
  totalPayments?: number;
}[];

export type DateRange = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
};

export interface Analytics {
  period: AnalyticsPeriod;
  range: {
    startDate: string;
    endDate: string;
  };
  overview: AnalyticsOverview;
  revenueTrend: TrendResult;
  invoiceStats: InvoiceStatResult;
  topClients: TopClientResult;
  topProducts: TopProductResult;
  recentSales: RecentSaleResult;
}
