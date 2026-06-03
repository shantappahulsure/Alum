import mongoose, {
  type Document,
  Schema,
} from "mongoose";

export interface IUser
  extends Document {
  username: string;

  email: string;

  password: string;

  role:
    | "user"
    | "recruiter"
    | "admin";

  firstName: string;

  lastName: string;

  companyName?: string;

  isBlocked: boolean;

  blockReason?: string;

  blockedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const UserSchema =
  new Schema<IUser>(
    {
      /*
========================================
USERNAME
========================================
*/

      username: {
        type: String,

        required: true,

        unique: true,

        lowercase: true,

        trim: true,
      },

      /*
========================================
EMAIL
========================================
*/

      email: {
        type: String,

        required: true,

        unique: true,

        trim: true,

        lowercase: true,
      },

      /*
========================================
PASSWORD
========================================
*/

      password: {
        type: String,

        required: true,
      },

      /*
========================================
ROLE
========================================
*/

      role: {
        type: String,

        enum: [
          "user",
          "recruiter",
          "admin",
        ],

        default: "user",
      },

      /*
========================================
FIRST NAME
========================================
*/

      firstName: {
        type: String,

        required: true,

        trim: true,
      },

      /*
========================================
LAST NAME
========================================
*/

      lastName: {
        type: String,

        required: true,

        trim: true,
      },

      /*
========================================
COMPANY NAME
========================================
*/

      companyName: {
        type: String,

        trim: true,
      },

      /*
========================================
BLOCK STATUS
========================================
*/

      isBlocked: {
        type: Boolean,

        default: false,
      },

      blockReason: {
        type: String,
      },

      blockedAt: {
        type: Date,
      },
    },

    {
      timestamps: true,
    }
  );

/*
========================================
INDEXES
========================================
*/

// UserSchema.index({
//   username: 1,
// });

// UserSchema.index({
//   email: 1,
// });

export default mongoose.model<IUser>(
  "User",
  UserSchema
);