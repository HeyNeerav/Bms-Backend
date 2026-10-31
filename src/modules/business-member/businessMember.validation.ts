import * as z from "zod";
import { BUSINESS_ROLE } from "@/consts.js";
import type { Types } from "mongoose";

export const allowedMembersSortFields = ["joinedAt", "role", "email"];

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Invalid email format").or(z.literal("")),
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
  // permissions: z.array(z.string()).optional(),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const getMembersSchema = z.object({
  search: z.string().trim().optional(),
  sortBy: z.enum(allowedMembersSortFields).optional(),
  sortOrder: z.union([z.literal(1), z.literal(-1)]).optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
})

export type FindMembersInput = z.infer<typeof getMembersSchema>

export const userIdParamSchema = z.object({
  userId: z.string().length(24, "Invalid user ID format"),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(Object.values(BUSINESS_ROLE), {
    message: "Invalid role. Must be one of OWNER, ADMIN, or EMPLOYEE",
  }),
})

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;