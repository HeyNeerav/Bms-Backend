import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import fs from "fs";

import { ApiError } from "../utils/ApiError.js";
import ENV from "@/env.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr)
        console.error("Error deleting single temp file:", unlinkErr);
    });
  }

  if (req.files) {
    const filesArray = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    filesArray.forEach((file: Express.Multer.File) => {
      if (file.path) {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr)
            console.error("Error deleting multi temp file:", unlinkErr);
        });
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      success: false,
      message: isTooLarge
        ? "File size is too large! Maximum limit is 5MB."
        : error.message,
      errors: [],
      ...(ENV.NODE_ENV === "development" && { stack: error.stack }),
    });
  }

  if (
    error instanceof Error &&
    error.message === "Only image files are allowed!"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: [],
      ...(ENV.NODE_ENV === "development" && { stack: error.stack }),
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      ...(ENV.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(ENV.NODE_ENV === "development" && {
      stack: error instanceof Error ? error.stack : undefined,
    }),
  });
};
