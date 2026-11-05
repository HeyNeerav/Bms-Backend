import type {
  AnalyticsPeriod,
  DateRange,
  RevenueResult,
  TrendResult,
} from "./analytics.types.js";

export const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

export const startOfUtcMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const getDateRange = (
  period: AnalyticsPeriod,
  now = new Date(),
  lifetimeStartDate = new Date(0),
): DateRange => {
  const today = startOfUtcDay(now);
  const currentMonth = startOfUtcMonth(now);
  const currentYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  let startDate = new Date(lifetimeStartDate);
  let endDate = today;

  switch (period) {
    case "7d":
      startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - 7);
      break;

    case "30d":
      startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - 30);
      break;

    case "90d":
      startDate = new Date(today);
      startDate.setUTCDate(startDate.getUTCDate() - 90);
      break;

    case "12m":
      startDate = new Date(currentMonth);
      startDate.setUTCMonth(startDate.getUTCMonth() - 12);
      endDate = currentMonth;
      break;

    case "thisYear":
      startDate = currentYear;
      endDate = currentMonth;
      break;

    case "lastYear":
      startDate = new Date(
        Date.UTC(now.getUTCFullYear() - 1, 0, 1),
      );
      endDate = currentYear;
      break;

    case "lifetime":
      startDate = new Date(lifetimeStartDate);
      endDate = currentMonth;
      break;
  }

  if (period === "lifetime") {
    return {
      startDate,
      endDate,
      previousStartDate: startDate,
      previousEndDate: startDate,
    };
  }

  const duration = endDate.getTime() - startDate.getTime();

  return {
    startDate,
    endDate,
    previousStartDate: new Date(startDate.getTime() - duration),
    previousEndDate: startDate,
  };
};

export const getTrendUnit = (period: AnalyticsPeriod): "day" | "month" =>
  period === "7d" ||
    period === "30d" ||
    period === "90d"
    ? "day"
    : "month";
export const getBucketKey = (date: Date, unit: "day" | "month") => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  if (unit === "month") {
    return `${year}-${month}`;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getTrendBuckets = (
  startDate: Date,
  endDate: Date,
  unit: "day" | "month",
  results: TrendResult,
) => {
  const values = new Map(
    results.map(({ date, revenue }) => [
      getBucketKey(date instanceof Date ? date : new Date(date), unit),
      revenue,
    ]),
  );

  const buckets: { date: string; revenue: number }[] = [];
  const cursor =
    unit === "day" ? startOfUtcDay(startDate) : startOfUtcMonth(startDate);

  const lastDate =
    unit === "day" ? startOfUtcDay(endDate) : startOfUtcMonth(endDate);

  while (cursor < lastDate) {
    const key = getBucketKey(cursor, unit);

    buckets.push({
      date: key,
      revenue: values.get(key) ?? 0,
    });

    if (unit === "day") {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return buckets;
};

export const getRevenueGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
};

export const getSum = (result: RevenueResult) => result[0]?.total ?? 0;
