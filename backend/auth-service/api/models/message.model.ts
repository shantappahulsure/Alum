import mongoose from "mongoose";

const messageSchema =
  new mongoose.Schema(
    {
      senderUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      receiverUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      message: {
        type: String,
        required: false,
        trim: true,
      },
      image: {
        type: String,
        default: "",
      },
      
      file: {
        type: String,
        default: "",
      },
      
      fileName: {
        type: String,
        default: "",
      },
      fileType: {
        type: String,
        default: "",
      },
      
      fileUrl: {
        type: String,
        default: "",
      },

      /*
========================================
DELIVERED STATUS
========================================
*/

      delivered: {
        type: Boolean,
        default: false,
      },

      /*
========================================
SEEN STATUS
========================================
*/

      seen: {
        type: Boolean,
        default: false,
      },

      /*
========================================
SEEN TIME
========================================
*/

      seenAt: {
        type: Date,
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

const Message =
  mongoose.models.Message ||
  mongoose.model(
    "Message",
    messageSchema
  );

export default Message;