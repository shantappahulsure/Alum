import express from "express";

import Notification from "../models/notification.model";

const router = express.Router();

/*
========================================
GET USER NOTIFICATIONS
========================================
*/

router.get(
  "/:email",
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          recipientEmail:
            req.params.email,
        }).sort({
          createdAt: -1,
        });

      res.json(
        notifications
      );
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  }
);

/*
========================================
MARK AS READ
========================================
*/

router.put(
  "/read/:id",
  async (req, res) => {
    try {
      const notification =
        await Notification.findByIdAndUpdate(
          req.params.id,
          {
            read: true,
          },
          {
            new: true,
          }
        );

      res.json(
        notification
      );
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  }
);

export default router;