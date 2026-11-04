import type { Request, Response } from "express";

import { generateTokens } from "./auth.helper.js";
import { cookieOptions } from "./auth.const.js";
import {
  forgotPasswordService,
  loginUserService,
  logoutUserService,
  refreshAccessTokenService,
  registerUserService,
  resetPasswordService,
  verifyVerificationCodeService,
} from "./auth.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyVerificationCodeSchema,
} from "./auth.validation.js";

import { asyncHandler } from "@/shared/utils/asyncHandler.js";
import { ApiResponse } from "@/shared/utils/ApiResponse.js";

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);
    await registerUserService({
      ...(req.file && { avatarLocalPath: req.file.path }),
      ...body,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "User registered successfully. Please check your email for verification code"));
  },
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const { userData, accessToken, refreshToken } = await loginUserService({
    identifier,
    password,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
        },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  await logoutUserService(userId);

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken = refreshTokenSchema.parse(
      req.cookies.refreshToken || req.body.refreshToken,
    );

    const { accessToken, refreshToken } =
      await refreshAccessTokenService(incomingRefreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
  },
);

export const verifyVerificationCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, code } = verifyVerificationCodeSchema.parse(req.body);

    await verifyVerificationCodeService({ email, code });

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Verification code verified successfully"),
      );
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await forgotPasswordService(email);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset email sent successfully"));
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, userId, newPassword } = resetPasswordSchema.parse(req.body);

    const { accessToken, refreshToken } = await resetPasswordService({
      token,
      userId,
      newPassword,
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  },
);

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      user,
    });
});
