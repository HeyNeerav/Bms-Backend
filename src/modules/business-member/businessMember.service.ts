import { Types } from "mongoose";

import { Business } from "../business/Business.model.js";
import { type UserIdParam, type UpdateMemberInput, type FindMembersInput, allowedMembersSortFields } from "./businessMember.validation.js";
import { BusinessMember, type IBusinessMemberDocument } from "./BusinessMember.model.js";

import type { BusinessRole } from "@/consts.js";
import { ApiError } from "@/shared/utils/ApiError.js";
import { User } from "../user/User.model.js";
import { escapeRegex } from "@/shared/utils/escapeRegex.js";

type WorkspaceContext = UserIdParam & {
  currUserRole: string;
  businessId: Types.ObjectId | string;
}

type AddMemberParams = Omit<WorkspaceContext, "userId"> & {   
  role: BusinessRole;
  email: string;
  // permissions?: string[];
}

type FindMembersPayload = FindMembersInput & {
  businessId: Types.ObjectId | string;
}

type RemoveBusinessPayload = WorkspaceContext & {
  currUserId: Types.ObjectId | string;
}

export const addBusinessMember = async (
  payload: AddMemberParams
) => {
  const { currUserRole, businessId, email, role } = payload;

  if (!email || !role) {
    throw new ApiError(400, "Email and Role are required");
  }


  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot invite owners to the business");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  const userId = user?._id;

  if (!user || !userId) {
    return;
  }


  const existingMember = await BusinessMember.findOne({
    businessId,
    userId,
  });

  if (existingMember) {
    if (existingMember.isArchived) {
      existingMember.isArchived = false;
      existingMember.role = role;
      // existingMember.permissions = permissions;
      existingMember.joinedAt = new Date();
      await existingMember.save();
      return existingMember;
    } else {
      throw new ApiError(400, "User is already a member of this business");
    }
  }

  const newMember = await BusinessMember.create({
    businessId,
    userId,
    role,
    // permissions,
  })

  if (!newMember) {
    throw new ApiError(500, "Failed to add member to business");
  }

  return newMember;
};

export const findBusinessMembers = async (payload: FindMembersPayload) => {
  const { businessId, search, ...options } = payload;

  const sortBy = allowedMembersSortFields.includes(options.sortBy ?? "")
    ? options.sortBy!
    : "joinedAt";
  const sortOrder = options.sortOrder ?? -1;
  
  const pipeline: any[] = [
    {
      $match: {
        businessId: new Types.ObjectId(businessId),
        isArchived: false,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $arrayElemAt: ["$user", 0],
        },
      },
    },
  ]

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: escapeRegex(search), $options: "i" } },
          { "user.email": { $regex: escapeRegex(search), $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({
    $sort: {
      [sortBy]: sortOrder,
    },
  },
  {
    $project: {
      metadata: 0,
      __v: 0,
    },
  })

  const memberAggregate = BusinessMember.aggregate(pipeline);

  const members = await BusinessMember.aggregatePaginate(memberAggregate, {
    page: options.page || 1,
    limit: options.limit || 10,
    countQuery: BusinessMember.aggregate(pipeline)
  });

  return members;
};

export const changeMemberRole = async (
  payload: WorkspaceContext & UpdateMemberInput
): Promise<void> => {
  const { currUserRole, businessId, userId, role } = payload;

  if (currUserRole === "ADMIN" && role === "OWNER") {
    throw new ApiError(403, "Admins cannot assign owner role to members");
  }

  if (!businessId || !userId || !role) {
    throw new ApiError(400, "Business ID, User ID and Role are required");
  }

  const member = await BusinessMember.findOne({ businessId, userId, isArchived: false });

  if (!member) {
    throw new ApiError(404, "Member not found in this business");
  }

  member.role = role;
  await member.save();
};

export const removeBusinessMember = async (
  payload: RemoveBusinessPayload
): Promise<void> => {
  const { currUserId, currUserRole, businessId, userId } = payload;

  if (!businessId || !userId) {
    throw new ApiError(400, "Business ID and User ID are required");
  }

  const [business, targetMembership] = await Promise.all([
    Business.findOne({ _id: businessId, isArchived: false }),
    BusinessMember.findOne({ businessId, userId })
  ]);

  if (!business) {
    throw new ApiError(404, "Business not found");
  }

  if (!targetMembership) {
    throw new ApiError(404, "Target member not found in this business");
  }
  
  if (targetMembership?.userId.toString() === currUserId.toString()) {
    throw new ApiError(403, "Users cannot remove themselves from the business");
  }

  if (business.createdBy.toString() === userId) {
    throw new ApiError(403, "Business owners cannot be removed from the business");
  }

  if (currUserRole === "ADMIN" && targetMembership?.role === "OWNER") {
    throw new ApiError(403, "Admins cannot remove owners from the business");
  }

  targetMembership.isArchived = true;
  await targetMembership.save();
};