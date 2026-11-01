import path from "node:path";
import fs from "node:fs/promises";
import Handlebars from "handlebars";
import puppeteer from "puppeteer-core";
import type { PopulatedDoc } from "mongoose";

import ENV from "@/env.js";
import type { IInvoice } from "./Invoice.model.js";
import { ApiError } from "@/shared/utils/ApiError.js";

const dirName = import.meta.dirname;

Handlebars.registerHelper("formatDate", (date: Date | string) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
});

Handlebars.registerHelper("formatCurrency", (amount: number) => {
  if (amount == null) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
});

export const createPdf = async (
  invoice: PopulatedDoc<IInvoice>,
): Promise<Uint8Array> => {
  const templatePath = path.join(
    dirName,
    "templates/invoice.hbs",
  );

  const source = await fs.readFile(templatePath, "utf-8");
  const template = Handlebars.compile(source);

  const html = template(invoice);

  const browser = await puppeteer.launch({
    executablePath: ENV.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    const pdf = await page.pdf({
      format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
    });

    return pdf;
  } catch (error) {
    throw new ApiError(
      500,
      error instanceof Error ? error.message : "Failed to generate PDF",
      [],
      error instanceof Error ? error.stack : undefined,
    );
  } finally {
    await browser.close();
  }
};

