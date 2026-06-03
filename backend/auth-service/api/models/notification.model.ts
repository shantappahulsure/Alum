import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      recipientEmail: {
        type: String,
        required: true,
      },

      senderName: {
        type: String,
      },

      senderEmail: {
        type: String,
      },

      type: {
        type: String,
        enum: [
          "referral",
          "status",
          "message",
        ],

        default: "referral",
      },

      message: {
        type: String,
        required: true,
      },

      read: {
        type: Boolean,
        default: false,
      },
    },

    {
      timestamps: true,
    }
  );

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );

export default Notification;