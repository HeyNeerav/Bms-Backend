import type { Request, Response } from "express";

import { getAnalytics as getAnalyticsService } from "./analytics.service.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { analyticsQuerySchema } from "./analytics.schema.js";


export const getAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const businessId = req.workspace!.businessId;
    const query = analyticsQuerySchema.parse(req.query);

    const analytics = await getAnalyticsService(businessId, query);
    
    return res.status(200).json(new ApiResponse(
      200,
      analytics,
      "Analytics fetched successfully"
    ));

  }
)