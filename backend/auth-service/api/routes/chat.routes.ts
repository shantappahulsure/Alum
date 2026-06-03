import express from "express";

import Message from "../models/message.model";

import User from "../models/user.model";

import { io } from "../index";

import { upload } from "../uploads/multer";

const router = express.Router();

/*
========================================
SEND MESSAGE
========================================
*/

router.post(
  "/send",

  upload.single("file"),

  async (req, res) => {
    try {
      const {
        senderUsername,
        receiverUsername,
        message,
      } = req.body;

      const uploadedFile =
        req.file;

      /*
========================================
VALIDATION
========================================
*/

      if (
        !senderUsername ||
        !receiverUsername ||
        (!message &&
          !uploadedFile)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message or file is required",
        });
      }

      /*
========================================
FORMAT USERNAMES
========================================
*/

      const sender =
        senderUsername.toLowerCase();

      const receiver =
        receiverUsername.toLowerCase();

      /*
========================================
CHECK USERS EXIST
========================================
*/

      const senderUser =
        await User.findOne({
          username: sender,
        });

      const receiverUser =
        await User.findOne({
          username: receiver,
        });

      if (!senderUser) {
        return res.status(404).json({
          success: false,
          message:
            "Sender not found",
        });
      }

      if (!receiverUser) {
        return res.status(404).json({
          success: false,
          message:
            "Receiver not found",
        });
      }

      /*
========================================
PREVENT SELF MESSAGE
========================================
*/

      if (sender === receiver) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot message yourself",
        });
      }

      /*
========================================
FILE URL
========================================
*/

      const uploadedPath =
        uploadedFile
          ? `${process.env.BASE_URL}/uploads/${uploadedFile.filename}`
          : "";

      /*
========================================
CHECK FILE TYPE
========================================
*/

      const isImage =
        uploadedFile?.mimetype?.startsWith(
          "image"
        );

      /*
========================================
SAVE MESSAGE
========================================
*/

      const newMessage =
        await Message.create({
          senderUsername: sender,

          receiverUsername:
            receiver,

          message:
            message || "",

          image: isImage
            ? uploadedPath
            : "",

          file: !isImage
            ? uploadedPath
            : "",

          fileName:
            uploadedFile?.originalname ||
            "",

          fileType:
            uploadedFile?.mimetype ||
            "",

          delivered: true,

          seen: false,
        });

      /*
========================================
REALTIME MESSAGE
========================================
*/

      io.to(receiver).emit(
        "newMessage",
        newMessage
      );

      io.to(sender).emit(
        "newMessage",
        newMessage
      );

      /*
========================================
NOTIFICATION
========================================
*/

      io.to(receiver).emit(
        "newNotification",
        {
          type: "message",

          message: `${sender} sent you a message`,
        }
      );

      /*
========================================
SUCCESS RESPONSE
========================================
*/

      res.status(200).json({
        success: true,

        message: "Message sent",

        data: newMessage,
      });
    } catch (error) {
      console.error(
        "SEND MESSAGE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

/*
========================================
MARK MESSAGE AS SEEN
========================================
*/

router.put(
  "/seen/:messageId",

  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      /*
========================================
UPDATE MESSAGE
========================================
*/

      const updatedMessage =
        await Message.findByIdAndUpdate(
          messageId,

          {
            seen: true,

            read: true,

            seenAt:
              new Date(),
          },

          {
            new: true,
          }
        );

      /*
========================================
MESSAGE NOT FOUND
========================================
*/

      if (!updatedMessage) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found",
        });
      }

      /*
========================================
REALTIME SEEN EVENT
========================================
*/

      io.to(
        updatedMessage.senderUsername
      ).emit(
        "messageSeen",
        {
          messageId:
            updatedMessage._id,

          seenBy:
            updatedMessage.receiverUsername,
        }
      );

      res.status(200).json({
        success: true,

        message:
          "Message marked as seen",

        data: updatedMessage,
      });
    } catch (error) {
      console.error(
        "SEEN ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

/*
========================================
GET CONVERSATION
========================================
*/

router.get(
  "/conversation",

  async (req, res) => {
    try {
      const {
        senderUsername,
        receiverUsername,
      } = req.query;

      /*
========================================
VALIDATION
========================================
*/

      if (
        !senderUsername ||
        !receiverUsername
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Usernames required",
        });
      }

      const sender =
        String(
          senderUsername
        ).toLowerCase();

      const receiver =
        String(
          receiverUsername
        ).toLowerCase();

      /*
========================================
GET MESSAGES
========================================
*/

      const messages =
        await Message.find({
          $or: [
            {
              senderUsername:
                sender,

              receiverUsername:
                receiver,
            },

            {
              senderUsername:
                receiver,

              receiverUsername:
                sender,
            },
          ],
        }).sort({
          createdAt: 1,
        });

      res.status(200).json({
        success: true,

        messages,
      });
    } catch (error) {
      console.error(
        "GET CONVERSATION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

/*
========================================
GET ALL CONVERSATIONS
========================================
*/

router.get(
  "/conversations/:username",

  async (req, res) => {
    try {
      const { username } =
        req.params;

      const currentUser =
        username.toLowerCase();

      /*
========================================
GET USER MESSAGES
========================================
*/

      const messages =
        await Message.find({
          $or: [
            {
              senderUsername:
                currentUser,
            },

            {
              receiverUsername:
                currentUser,
            },
          ],
        }).sort({
          createdAt: -1,
        });

      /*
========================================
BUILD CONVERSATIONS
========================================
*/

      const conversationMap =
        new Map();

      messages.forEach(
        (msg: any) => {
          const otherUser =
            msg.senderUsername ===
            currentUser
              ? msg.receiverUsername
              : msg.senderUsername;

          /*
========================================
CREATE CHAT IF NOT EXISTS
========================================
*/

          if (
            !conversationMap.has(
              otherUser
            )
          ) {
            conversationMap.set(
              otherUser,
              {
                username:
                  otherUser,

                lastMessage:
                  msg.message ||
                  msg.fileName ||
                  "Attachment",

                lastMessageTime:
                  msg.createdAt,

                unreadCount: 0,
              }
            );
          }

          /*
========================================
COUNT ONLY UNREAD
========================================
*/

          if (
            msg.receiverUsername ===
              currentUser &&
            !msg.seen
          ) {
            const existing =
              conversationMap.get(
                otherUser
              );

            existing.unreadCount += 1;

            conversationMap.set(
              otherUser,
              existing
            );
          }
        }
      );

      res.status(200).json({
        success: true,

        conversations:
          Array.from(
            conversationMap.values()
          ),
      });
    } catch (error) {
      console.error(
        "GET CONVERSATIONS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

export default router;