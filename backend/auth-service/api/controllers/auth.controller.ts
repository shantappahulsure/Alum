import type { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User, { IUser } from "../models/user.model";
import PasswordReset from "../models/password-reset.model";
import OTP from "../models/otp.model";

import { validatePassword } from "../utils/password-validator";
import { sendPasswordResetEmail } from "../utils/email-service";

import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  deleteAllUserRefreshTokens,
  verifyToken,
} from "../utils/token";

import config from "../config";

/*
==================================================
MAIL TRANSPORTER
==================================================
*/

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

  console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASSWORD EXISTS =",
  !!process.env.EMAIL_PASSWORD
);
console.log("STARTING SMTP VERIFY");
transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP VERIFY ERROR:", err);
  } else {
    console.log("SMTP READY");
  }
});

/*
==================================================
REGISTER
==================================================
*/

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      companyName,
    } = req.body;

    const existingUser =
      await User.findOne({
        email,
      });
     const existingUsername =
  await User.findOne({
    username:
      username.toLowerCase(),
  });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });

      return;
    }
    if (existingUsername) {
      res.status(400).json({
        success: false,
        message:
          "Username already taken",
      });
    
      return;
    }

    if (
      role === "user" &&
      (!firstName || !lastName)
    ) {
      res.status(400).json({
        success: false,
        message:
          "First name and last name required",
      });

      return;
    }

    if (
      role === "recruiter" &&
      (!firstName ||
        !lastName ||
        !companyName)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Company name and full name required",
      });

      return;
    }

    const passwordValidation =
      validatePassword(password);

    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message:
          passwordValidation.message,
      });

      return;
    }

    const salt =
      await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    const user = new User({
      username:
      username.toLowerCase(),
      email,
      password: hashedPassword,
      role: role || "user",
      firstName,
      lastName,
      companyName:
        role === "recruiter"
          ? companyName
          : undefined,
    });

    await user.save();

    const tokenPayload = {
      userId: user._id,
    
      username:
        user.username,
    
      role: user.role,
    
      firstName:
        user.firstName,
    
      lastName:
        user.lastName,
    
      email: user.email,
    };

    const accessToken =
      generateAccessToken(
        tokenPayload
      );

    const refreshToken =
      generateRefreshToken({
        userId: user._id,
      });

    await saveRefreshToken(
      refreshToken,
      String(user._id)
    );

    res.status(201).json({
      success: true,
      message:
        "User registered successfully",

      accessToken,

      refreshToken,

      user: {
        id: user._id,
      
        username:
          user.username,
      
        email: user.email,
      
        role: user.role,
      
        firstName:
          user.firstName,
      
        lastName:
          user.lastName,
      
        companyName:
          user.companyName,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
==================================================
LOGIN
==================================================
*/

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } =
      req.body;

    const user =
      (await User.findOne({
        email,
      })
        .lean()
        .exec()) as
        | (IUser & {
            _id: mongoose.Types.ObjectId;
          })
        | null;

    if (!user) {
      res.status(400).json({
        success: false,
        message:
          "Invalid credentials",
      });

      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message:
          "Your account is blocked",

        isBlocked: true,

        reason: user.blockReason,
      });

      return;
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message:
          "Invalid credentials",
      });

      return;
    }

    const tokenPayload = {
      userId: user._id,
    
      username:
        user.username,
    
      role: user.role,
    
      firstName:
        user.firstName,
    
      lastName:
        user.lastName,
    
      email: user.email,
    };

    const accessToken =
      generateAccessToken(
        tokenPayload
      );

    const refreshToken =
      generateRefreshToken({
        userId: user._id,
      });

    await saveRefreshToken(
      refreshToken,
      String(user._id)
    );

    res.status(200).json({
      success: true,

      accessToken,

      refreshToken,

      user: {
        id: user._id,
      
        username:
          user.username,
      
        email: user.email,
      
        role: user.role,
      
        firstName:
          user.firstName,
      
        lastName:
          user.lastName,
      
        companyName:
          user.companyName,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
==================================================
REFRESH TOKEN
==================================================
*/

export const refreshToken =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { refreshToken } =
        req.body;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message:
            "Refresh token required",
        });

        return;
      }

      const tokenDoc =
        await findRefreshToken(
          refreshToken
        );

      if (!tokenDoc) {
        res.status(401).json({
          success: false,
          message:
            "Invalid refresh token",
        });

        return;
      }

      const decoded =
        verifyToken(
          refreshToken,
          config.jwt
            .refreshSecret
        );

      const user =
        await User.findById(
          decoded.userId
        );

      if (!user) {
        res.status(404).json({
          success: false,
          message:
            "User not found",
        });

        return;
      }

      const tokenPayload = {
        userId: user._id,
      
        username:
          user.username,
      
        role: user.role,
      
        firstName:
          user.firstName,
      
        lastName:
          user.lastName,
      
        email: user.email,
      };

      const accessToken =
        generateAccessToken(
          tokenPayload
        );

      res.status(200).json({
        success: true,

        accessToken,

        user: {
          id: user._id,
        
          username:
            user.username,
        
          email: user.email,
        
          role: user.role,
        
          firstName:
            user.firstName,
        
          lastName:
            user.lastName,
        
          companyName:
            user.companyName,
        },
      });
    } catch (error) {
      console.error(
        "REFRESH TOKEN ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

/*
==================================================
LOGOUT
==================================================
*/

export const logout = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } =
      req.body;

    if (refreshToken) {
      await deleteRefreshToken(
        refreshToken
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Logged out successfully",
    });
  } catch (error) {
    console.error(
      "LOGOUT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
==================================================
VALIDATE TOKEN
==================================================
*/

export const validateToken =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const authHeader =
        req.headers.authorization;

      if (
        !authHeader ||
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        res.status(401).json({
          valid: false,
          message:
            "No token provided",
        });

        return;
      }

      const token =
        authHeader.split(" ")[1];

      const decoded =
        verifyToken(
          token,
          config.jwt.secret
        );

      res.status(200).json({
        valid: true,

        userId:
          decoded.userId,

        role: decoded.role,

        firstName:
          decoded.firstName,

        lastName:
          decoded.lastName,
          username:
  decoded.username,

email: decoded.email,

       
      });
    } catch (error) {
      console.error(
        "VALIDATE TOKEN ERROR:",
        error
      );

      res.status(401).json({
        valid: false,
        message:
          "Invalid or expired token",
      });
    }
  };

/*
==================================================
SEND OTP
==================================================
*/

export const sendOTP = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });

      return;
    }

    const otp = Math.floor(
      100000 +
        Math.random() * 900000
    ).toString();

    await OTP.deleteMany({
      email,
    });

    await OTP.create({
      email,

      otp,

      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to: email,

      subject:
        "Email Verification OTP",

      html: `
        <div style="font-family:sans-serif">
          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <h1>${otp}</h1>

          <p>Valid for 5 minutes</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message:
        "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to send OTP",
    });
  }
};

/*
==================================================
VERIFY OTP
==================================================
*/

export const verifyOTP = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, otp } =
      req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message:
          "Email and OTP required",
      });

      return;
    }

    const existingOTP =
      await OTP.findOne({
        email,
        otp,
      });

    if (!existingOTP) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });

      return;
    }

    if (
      existingOTP.expiresAt <
      new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "OTP expired",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "OTP verified successfully",
    });
  } catch (error) {
    console.error(
      "VERIFY OTP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
==================================================
RESET PASSWORD WITH OTP
==================================================
*/

export const resetPasswordWithOTP =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
        otp,
        newPassword,
      } = req.body;

      if (
        !email ||
        !otp ||
        !newPassword
      ) {
        res.status(400).json({
          success: false,
          message:
            "All fields required",
        });

        return;
      }

      const otpRecord =
        await OTP.findOne({
          email,
          otp,
        });

      if (!otpRecord) {
        res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });

        return;
      }

      if (
        otpRecord.expiresAt <
        new Date()
      ) {
        res.status(400).json({
          success: false,
          message: "OTP expired",
        });

        return;
      }

      const passwordValidation =
        validatePassword(
          newPassword
        );

      if (
        !passwordValidation.isValid
      ) {
        res.status(400).json({
          success: false,
          message:
            passwordValidation.message,
        });

        return;
      }

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });

        return;
      }

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          salt
        );

      user.password =
        hashedPassword;

      await user.save();

      await OTP.deleteMany({
        email,
      });

      await deleteAllUserRefreshTokens(
        String(user._id)
      );

      res.status(200).json({
        success: true,
        message:
          "Password reset successful",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD OTP ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

/*
==================================================
UPDATE USER PROFILE
==================================================
*/

export const updateUserProfile =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { userId } =
        req.params;

      const {
        firstName,
        lastName,
        email,
      } = req.body;

      const user =
        await User.findByIdAndUpdate(
          userId,
          {
            ...(firstName && {
              firstName,
            }),

            ...(lastName && {
              lastName,
            }),

            ...(email && {
              email,
            }),
          },
          {
            new: true,
          }
        ).select("-password");

      if (!user) {
        res.status(404).json({
          success: false,
          message:
            "User not found",
        });

        return;
      }

      res.status(200).json({
        success: true,
        message:
          "Profile updated successfully",

        user,
      });
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };