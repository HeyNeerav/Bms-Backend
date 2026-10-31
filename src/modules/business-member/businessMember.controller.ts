import type { Request, Response } from "express";

import {
  addBusinessMember,
  changeMemberRole,
  findBusinessMembers,
  removeBusinessMember
} from "./businessMember.service.js";
import {
  getMembersSchema,
  inviteMemberSchema,
  updateMemberSchema,
  userIdParamSchema
} from "./businessMember.validation.js";

import { ApiResponse } from "@/shared/utils/ApiResponse.js";
import { asyncHandler } from "@/shared/utils/asyncHandler.js";


export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = inviteMemberSchema.parse(req.body);

  await addBusinessMember({
    role,
    // permissions: body.permissions,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    email,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "If the user exists, membership invitation has been sent successfully")
  );
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const query = getMembersSchema.parse(req.query);
  const members = await findBusinessMembers({
    businessId: req.workspace!.businessId,
    ...query,
  });
  return res.status(200).json(
    new ApiResponse(200, members, "Members retrieved successfully")
  );
});

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = updateMemberSchema.parse(req.body);
  const { userId } = userIdParamSchema.parse(req.params);
  await changeMemberRole({
    role,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    userId,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member role updated successfully")
  );
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => { 
  const { userId } = userIdParamSchema.parse(req.params);
  await removeBusinessMember({
    currUserId: req.user!._id,
    currUserRole: req.workspace!.role,
    businessId: req.workspace!.businessId,
    userId,
  });
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Member removed successfully")
  );
});