import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    fromUser: {
      type: String,
      required: true,
    },

    fromEmail: {
      type: String,
      required: true,
    },

    toUser: {
      type: String,
      required: true,
    },

    toEmail: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Referral",
  referralSchema
);