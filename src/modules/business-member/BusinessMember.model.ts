
import { BUSINESS_ROLE, type BusinessRole } from "@/consts.js";
import { Schema, model, Types, type HydratedDocument, type AggregatePaginateModel } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IBusinessMember {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  role: BusinessRole;
  permissions: string[];
  isArchived: boolean;
  joinedAt: Date;
}

export type IBusinessMemberDocument = HydratedDocument<IBusinessMember>;

const businessMemberSchema = new Schema<IBusinessMember>(
  {
    businessId: {
      type: Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(BUSINESS_ROLE),
      default: BUSINESS_ROLE.EMPLOYEE,
    },

    permissions: {
      type: [String],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

businessMemberSchema.index({
  businessId: 1, 
  userId: 1,
}, { unique: true })

businessMemberSchema.plugin(mongooseAggregatePaginate);

export const BusinessMember = model<IBusinessMember, AggregatePaginateModel<IBusinessMember>>(
  "BusinessMember",
  businessMemberSchema
);