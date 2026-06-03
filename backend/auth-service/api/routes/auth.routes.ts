import { Router } from "express";

import {
  register,
  login,
  refreshToken,
  logout,
  validateToken,
  updateUserProfile,
  sendOTP,
  verifyOTP,
  resetPasswordWithOTP,
} from "../controllers/auth.controller";

import { rateLimiter } from "../middleware/rate-limiter";

import { verifyServiceToken } from "../middleware/auth";

const router = Router();

/*
==================================================
AUTH
==================================================
*/

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/refresh-token",
  refreshToken
);

router.post(
  "/logout",
  logout
);

router.post(
  "/validate-token",
  validateToken
);

/*
==================================================
OTP
==================================================
*/

router.post(
  "/send-otp",
  rateLimiter,
  sendOTP
);

router.post(
  "/verify-otp",
  rateLimiter,
  verifyOTP
);

/*
==================================================
RESET PASSWORD WITH OTP
==================================================
*/

router.post(
  "/reset-password-otp",
  rateLimiter,
  resetPasswordWithOTP
);

/*
==================================================
UPDATE PROFILE
==================================================
*/

router.put(
  "/users/:userId",
  verifyServiceToken,
  updateUserProfile
);


export default router;
