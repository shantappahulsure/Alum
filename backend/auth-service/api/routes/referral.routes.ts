import express from "express";
import nodemailer from "nodemailer";

import Referral from "../models/referral.model";
import { io } from "../index";
import Notification from "../models/notification.model";

const router = express.Router();

/*
========================================
MAIL TRANSPORTER
========================================
*/

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/*
========================================
SEND REFERRAL
========================================
*/

router.post("/", async (req, res) => {
  try {
    console.log("REFERRAL API HIT");

    const {
      fromUser,
      fromEmail,
      toUser,
      toEmail,
      company,
      message,
    } = req.body;

    /*
========================================
SAVE TO DATABASE
========================================
*/

    const referral =
      await Referral.create({
        fromUser,
        fromEmail,
        toUser,
        toEmail,
        company,
        message,
      });
/*
========================================
SAVE NOTIFICATION
========================================
*/

const notification =
  await Notification.create({
    recipientEmail: toEmail,

    senderName: fromUser,

    senderEmail: fromEmail,

    type: "referral",

    message: `${fromUser} sent you a referral request for ${company}`,
  });

/*
========================================
REALTIME NOTIFICATION
========================================
*/

io.to(toEmail).emit(
  "newReferral",
  {
    message:
      `${fromUser} sent you a referral request for ${company}`,

    notification,
  }
);

console.log(
  "REALTIME REFERRAL SENT TO:",
  toEmail
);

    /*
========================================
SEND EMAIL
========================================
*/

await transporter.sendMail({
    from: process.env.EMAIL_USER,
  
    to: toEmail,
  
    subject: `Referral Request for ${company}`,
  
    html: `
      <h2>New Referral Request</h2>
  
      <p><b>From:</b> ${fromUser}</p>
  
      <p><b>Email:</b> ${fromEmail}</p>
  
      <p><b>Company:</b> ${company}</p>
  
      <p><b>Message:</b></p>
  
      <p>${message}</p>
    `,
  });
  
  console.log("MAIL SENT");

    console.log("MAIL SENT");

    res.status(200).json({
      success: true,
      message:
        "Referral request sent successfully",
      referral,
    });
  } catch (error) {
    console.error(
      "REFERRAL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
});

/*
========================================
GET ALL REFERRALS
========================================
*/

router.get("/", async (req, res) => {
  try {
    const referrals =
      await Referral.find().sort({
        createdAt: -1,
      });

    res.json(referrals);
  } catch (error) {
    res.status(500).json({
      error: "Server error",
    });
  }
});

/*
========================================
UPDATE STATUS
========================================
*/

router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const referral =
      await Referral.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

    /*
========================================
REALTIME STATUS UPDATE
========================================
*/

    if (referral) {
      io.to(
        referral.fromEmail
      ).emit(
        "referralStatusUpdated",
        {
          message: `Your referral request was ${status}`,
          referral,
        }
      );

      console.log(
        "STATUS UPDATE SENT TO:",
        referral.fromEmail
      );
    }

    res.json(referral);
  } catch (error) {
    res.status(500).json({
      error: "Server error",
    });
  }
});

/*
========================================
DELETE REFERRAL
========================================
*/

router.delete("/:id", async (req, res) => {
  try {
    await Referral.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Referral deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;