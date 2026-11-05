import { Types, type PipelineStage } from "mongoose";

import { INVOICE_STATUS, PAYMENT_STATUS, PRODUCT_TYPE } from "@/consts.js";

import { Business } from "@/modules/business/Business.model.js";
import { Client } from "@/modules/client/Client.model.js";
import { Invoice } from "@/modules/invoice/Invoice.model.js";
import { Payment } from "@/modules/payment/Payment.model.js";
import { Product } from "@/modules/product/Product.model.js";

import type { AnalyticsQuery } from "./analytics.schema.js";
import type {
  Analytics,
  InvoiceStatResult,
  RecentSaleResult,
  RevenueByPaymentMethodResult,
  RevenueResult,
  TopClientResult,
  TopProductResult,
  TrendResult,
} from "./analytics.types.js";
import {
  getDateRange,
  getTrendUnit,
  getTrendBuckets,
  getRevenueGrowth,
  getSum,
} from "./analytics.utils.js";

export const getAnalytics = async (
  businessId: string | Types.ObjectId,
  query: AnalyticsQuery,
): Promise<Analytics> => {
  const businessObjectId =
    typeof businessId === "string"
      ? new Types.ObjectId(businessId)
      : businessId;

  const { period } = query;

  const business = await Business.findById(businessObjectId)
    .select("createdAt")
    .lean()
    .exec();

  const lifetimeStartDate = business?.createdAt ?? new Date(0);

  const { startDate, endDate, previousStartDate, previousEndDate } =
    getDateRange(period, new Date(), lifetimeStartDate);

  const activeBusinessFilter = {
    businessId: businessObjectId,
    isArchived: false,
  };

  const successfulPaymentFilter = {
    ...activeBusinessFilter,
    status: PAYMENT_STATUS.SUCCESS,
  };

  const currentRevenuePipeline: PipelineStage[] = [
    {
      $match: {
        ...successfulPaymentFilter,
        paidAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
  ];

  const previousRevenuePipeline: PipelineStage[] = [
    {
      $match: {
        ...successfulPaymentFilter,
        paidAt: {
          $gte: previousStartDate,
          $lt: previousEndDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ];

  const outstandingPipeline: PipelineStage[] = [
    {
      $match: {
        ...activeBusinessFilter,
        status: {
          $nin: [
            INVOICE_STATUS.DRAFT,
            INVOICE_STATUS.PAID,
            INVOICE_STATUS.CANCELLED,
          ],
        },
      },
    },
    {
      $lookup: {
        from: Payment.collection.name,
        let: {
          invoiceId: "$_id",
          business: "$businessId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$invoice", "$$invoiceId"] },
                  { $eq: ["$businessId", "$$business"] },
                  { $eq: ["$status", PAYMENT_STATUS.SUCCESS] },
                  { $eq: ["$isArchived", false] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ],
        as: "payments",
      },
    },
    {
      $set: {
        paidAmount: {
          $ifNull: [{ $arrayElemAt: ["$payments.total", 0] }, 0],
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $max: [{ $subtract: ["$total", "$paidAmount"] }, 0],
          },
        },
      },
    },
  ];

  const invoiceStatsPipeline: PipelineStage[] = [
    {
      $match: {
        ...activeBusinessFilter,
        issuedDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amount: { $sum: "$total" },
      },
    },
    {
      $project: {
        _id: 0,
        status: { $toString: "$_id" },
        count: 1,
        amount: 1,
      },
    },
    { $sort: { count: -1 } },
  ];

  const trendUnit = getTrendUnit(period);

  const revenueTrendPipeline: PipelineStage[] = [
    {
      $match: {
        ...successfulPaymentFilter,
        paidAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$paidAt",
            unit: trendUnit,
            timezone: "UTC",
          },
        },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: 1,
      },
    },
    { $sort: { date: 1 } },
  ];

  const revenueByPaymentMethodPipeline: PipelineStage[] = [
    {
      $match: {
        ...successfulPaymentFilter,
        paidAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: "$method",
        revenue: { $sum: "$amount" },
        transactions: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        method: "$_id",
        revenue: 1,
        transactions: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ];

  const topClientsPipeline: PipelineStage[] = [
    {
      $match: {
        ...successfulPaymentFilter,
        paidAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $lookup: {
        from: Invoice.collection.name,
        localField: "invoice",
        foreignField: "_id",
        as: "invoice",
      },
    },
    { $unwind: "$invoice" },
    {
      $match: {
        "invoice.businessId": businessObjectId,
        "invoice.isArchived": false,
      },
    },
    {
      $lookup: {
        from: Client.collection.name,
        localField: "invoice.client",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: "$client" },
    {
      $match: {
        "client.businessId": businessObjectId,
        "client.isArchived": false,
      },
    },
    {
      $group: {
        _id: "$client._id",
        name: { $first: "$client.name" },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        clientId: "$_id",
        name: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ];

  const topProductsPipeline: PipelineStage[] = [
    {
      $match: {
        ...activeBusinessFilter,
        issuedDate: { $gte: startDate, $lt: endDate },
        status: {
          $nin: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.CANCELLED],
        },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          productId: "$items.productId",
          name: "$items.name",
        },
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    {
      $project: {
        _id: 0,
        productId: "$_id.productId",
        name: "$_id.name",
        quantitySold: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ];

  const recentSalesPipeline: PipelineStage[] = [
    {
      $match: successfulPaymentFilter,
    },
    { $sort: { paidAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: Invoice.collection.name,
        localField: "invoice",
        foreignField: "_id",
        as: "invoice",
      },
    },
    { $unwind: "$invoice" },
    {
      $match: {
        "invoice.businessId": businessObjectId,
        "invoice.isArchived": false,
      },
    },
    {
      $lookup: {
        from: Client.collection.name,
        localField: "invoice.client",
        foreignField: "_id",
        as: "client",
      },
    },
    { $unwind: "$client" },
    {
      $project: {
        _id: 1,
        amount: 1,
        method: 1,
        paidAt: 1,
        transactionId: 1,
        invoiceNumber: "$invoice.invoiceNumber",
        clientName: "$client.name",
      },
    },
  ];

  const [
    currentRevenueResult,
    previousRevenueResult,
    outstandingResult,
    invoiceStats,
    revenueTrendResult,
    revenueByPaymentMethod,
    topClients,
    topProducts,
    recentSales,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    unpaidInvoices,
    totalClients,
    newClients,
    totalProducts,
    totalServices,
  ] = await Promise.all([
    Payment.aggregate<RevenueResult[number]>(currentRevenuePipeline),
    period === "lifetime"
      ? Promise.resolve([] as RevenueResult)
      : Payment.aggregate<RevenueResult[number]>(previousRevenuePipeline),
    Invoice.aggregate<RevenueResult[number]>(outstandingPipeline),
    Invoice.aggregate<InvoiceStatResult[number]>(invoiceStatsPipeline),
    Payment.aggregate<TrendResult[number]>(revenueTrendPipeline),
    Payment.aggregate<RevenueByPaymentMethodResult[number]>(
      revenueByPaymentMethodPipeline,
    ),
    Payment.aggregate<TopClientResult[number]>(topClientsPipeline),
    Invoice.aggregate<TopProductResult[number]>(topProductsPipeline),
    Payment.aggregate<RecentSaleResult[number]>(recentSalesPipeline),
    Invoice.countDocuments(activeBusinessFilter),
    Invoice.countDocuments({
      ...activeBusinessFilter,
      status: INVOICE_STATUS.PAID,
    }),
    Invoice.countDocuments({
      ...activeBusinessFilter,
      status: INVOICE_STATUS.OVERDUE,
    }),
    Invoice.countDocuments({
      ...activeBusinessFilter,
      status: {
        $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE],
      },
    }),
    Client.countDocuments(activeBusinessFilter),
    Client.countDocuments({
      ...activeBusinessFilter,
      createdAt: { $gte: startDate, $lt: endDate },
    }),
    Product.countDocuments({
      ...activeBusinessFilter,
      type: PRODUCT_TYPE.PRODUCT,
    }),
    Product.countDocuments({
      ...activeBusinessFilter,
      type: PRODUCT_TYPE.SERVICE,
    }),
  ]);

  const totalRevenue = getSum(currentRevenueResult);
  const previousPeriodRevenue = getSum(previousRevenueResult);
  const totalPayments = currentRevenueResult[0]?.totalPayments ?? 0;

  return {
    period,
    range: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    overview: {
      totalRevenue,
      previousPeriodRevenue,
      revenueChange:
        period === "lifetime"
          ? null
          : getRevenueGrowth(totalRevenue, previousPeriodRevenue),
      totalPayments,
      averageTransactionValue:
        totalPayments > 0 ? totalRevenue / totalPayments : 0,
      outstandingAmount: getSum(outstandingResult),
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      totalClients,
      newClients,
      totalProducts,
      totalServices,
    },
    revenueTrend: getTrendBuckets(
      startDate,
      endDate,
      trendUnit,
      revenueTrendResult,
    ),
    revenueByPaymentMethod,
    invoiceStats,
    topClients,
    topProducts,
    recentSales,
  };
};
