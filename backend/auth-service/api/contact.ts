import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("CONTACT ROUTE HIT");
    console.log(req.body);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    console.log("SMTP VERIFIED");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${req.body.subject}`,
      text: `
Name: ${req.body.firstName} ${req.body.lastName}
Email: ${req.body.email}

Message:
${req.body.message}
      `,
    });

    console.log(info);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log("CONTACT ERROR:");
    console.log(error);

    return res.status(500).json({
      success: false,
      error,
    });
  }
});

export default router;