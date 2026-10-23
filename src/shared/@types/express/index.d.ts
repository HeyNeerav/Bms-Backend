import type { IBusinessMemberDocument } from "@/modules/business-member/BusinessMember.model.js";
import type { IUserDocument } from "@/modules/user/User.model.js";

type WorkspaceContext = {
  membershipId: IBusinessMemberDocument["_id"];
  businessId: IBusinessMemberDocument["businessId"];
  role: IBusinessMemberDocument["role"];
};

declare global {
  namespace Express {
    interface User extends Pick<
      IUserDocument,
      "_id" | "email" | "name" | "username"
    > {}

    interface Request {
      user?: User;
      workspace?: WorkspaceContext;
    }
  }
}

export {};
