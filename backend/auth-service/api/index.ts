import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

import { errorHandler } from "./middleware/error-handler";
import config from "./config";
import { cleanupExpiredTokens } from "./utils/token";

const app = express();

/*
===========================
CORS CONFIGURATION
===========================
*/
const allowedOrigins = [
  "http://localhost:3000",
  "https://alum1.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  })
);

/*
Allow preflight requests
*/
app.options("/*", cors());

/*
===========================
MIDDLEWARE
===========================
*/
app.use(helmet());
app.use(express.json());
app.use(morgan("combined"));

/*
===========================
MONGODB CONNECTION
===========================
*/
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

/*
===========================
ROUTES
===========================
*/
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

/*
===========================
HEALTH CHECK
===========================
*/
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
  });
});

/*
===========================
ERROR HANDLER
===========================
*/
app.use(errorHandler);

/*
===========================
TOKEN CLEANUP JOB
===========================
*/
if (config.nodeEnv === "production") {
  setInterval(async () => {
    try {
      const result = await cleanupExpiredTokens();
      console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    } catch (error) {
      console.error("Token cleanup error:", error);
    }
  }, 24 * 60 * 60 * 1000);
}

/*
===========================
SERVER
===========================
*/
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

export default app;