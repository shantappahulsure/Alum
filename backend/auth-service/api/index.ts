import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import referralRoutes from "./routes/referral.routes";
import notificationRoutes from "./routes/notification.routes";
import chatRoutes from "./routes/chat.routes";

import contactRoutes from "./contact";

import { errorHandler } from "./middleware/error-handler";

import config from "./config";

import { cleanupExpiredTokens } from "./utils/token";

import http from "http";

import { Server } from "socket.io";
import path from "path";

const app = express();

/*
========================================
CORS CONFIGURATION
========================================
*/

/*
========================================
CORS CONFIGURATION
========================================
*/

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (origin === "http://localhost:3000") {
        return callback(null, true);
      }

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      console.log("Blocked CORS Origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token",
    ],
  })
);

/*
========================================
MIDDLEWARE
========================================
*/

app.use(helmet());

app.use(express.json());

app.use(morgan("combined"));

/*
========================================
MONGODB CONNECTION
========================================
*/

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log(
      "Connected to MongoDB"
    );
  })
  .catch((err) => {
    console.error(
      "Could not connect to MongoDB",
      err
    );
  });

/*
========================================
ROUTES
========================================
*/

app.use(
  "/api/contact",
  contactRoutes
);

app.use(
  "/api/referrals",
  referralRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);


app.use(
  "/uploads",
  express.static(
    path.join(
      process.cwd(),
      "api",
      "uploads"
    ),
    {
      setHeaders: (res) => {
        res.setHeader(
          "Access-Control-Allow-Origin",
          "*"
        );

        res.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin"
        );
      },
    }
  )
);
/*
========================================
HEALTH CHECK
========================================
*/

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      status: "ok",

      service:
        "auth-service",
    });
  }
);

/*
========================================
ERROR HANDLER
========================================
*/

app.use(errorHandler);

/*
========================================
TOKEN CLEANUP JOB
========================================
*/

if (
  config.nodeEnv ===
  "production"
) {
  setInterval(
    async () => {
      try {
        const result =
          await cleanupExpiredTokens();

        console.log(
          `Cleaned up ${result.deletedCount} expired tokens`
        );
      } catch (error) {
        console.error(
          "Token cleanup error:",
          error
        );
      }
    },

    24 *
      60 *
      60 *
      1000
  );
}

/*
========================================
HTTP SERVER
========================================
*/

const server =
  http.createServer(app);

/*
========================================
SOCKET IO
========================================
*/

export const io =
  new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

/*
========================================
ONLINE USERS
========================================
*/

const onlineUsers =
  new Map<string, number>();

/*
========================================
SOCKET CONNECTION
========================================
*/

io.on(
  "connection",
  (socket) => {
    console.log(
      "USER CONNECTED:",
      socket.id
    );

    /*
========================================
JOIN ROOM
========================================
*/

socket.on(
  "join",
  (username: string) => {
    try {
      /*
========================================
JOIN USER ROOM
========================================
*/

      socket.join(username);

      /*
========================================
STORE USERNAME
========================================
*/

      socket.data.username =
        username;

      /*
========================================
ADD SOCKET COUNT
========================================
*/

      const currentCount =
        onlineUsers.get(
          username
        ) || 0;

      onlineUsers.set(
        username,
        currentCount + 1
      );

      /*
========================================
SEND ONLINE USERS
========================================
*/

      io.emit(
        "onlineUsers",
        Array.from(
          onlineUsers.keys()
        )
      );

      console.log(
        `ROOM JOINED: ${username}`
      );

      console.log(
        "ONLINE USERS:",
        Array.from(
          onlineUsers.keys()
        )
      );

      console.log(
        "SOCKET ROOMS:",
        socket.rooms
      );
    } catch (error) {
      console.log(
        "JOIN ERROR:",
        error
      );
    }
  }
);

    /*
========================================
TYPING EVENT
========================================
*/

    socket.on(
      "typing",
      (data) => {
        console.log(
          "TYPING:",
          data
        );

        socket
          .to(
            data.receiverUsername
          )
          .emit(
            "typing",
            data.senderUsername
          );
      }
    );

    /*
========================================
STOP TYPING
========================================
*/

    socket.on(
      "stopTyping",
      (data) => {
        console.log(
          "STOP TYPING:",
          data
        );

        socket
          .to(
            data.receiverUsername
          )
          .emit(
            "stopTyping"
          );
      }
    );

    /*
========================================
MESSAGE SEEN
========================================
*/

    socket.on(
      "messageSeen",
      (data) => {
        socket
          .to(
            data.senderUsername
          )
          .emit(
            "messageSeen",
            {
              seenBy:
                data.receiverUsername,
            }
          );
      }
    );

  /*
========================================
DISCONNECT
========================================
*/

socket.on(
  "disconnect",
  () => {
    const username =
      socket.data.username;

    console.log(
      "USER DISCONNECTED:",
      socket.id
    );

    /*
========================================
REMOVE USER AFTER 5 SEC
========================================
*/

    if (username) {
      setTimeout(() => {
        /*
========================================
GET CURRENT SOCKET COUNT
========================================
*/

        const currentCount =
          onlineUsers.get(
            username
          ) || 0;

        /*
========================================
REMOVE ONLY LAST SOCKET
========================================
*/

        if (
          currentCount <= 1
        ) {
          onlineUsers.delete(
            username
          );
        } else {
          onlineUsers.set(
            username,
            currentCount - 1
          );
        }

        /*
========================================
SEND ONLINE USERS
========================================
*/

        io.emit(
          "onlineUsers",
          Array.from(
            onlineUsers.keys()
          )
        );

        console.log(
          "ONLINE USERS:",
          Array.from(
            onlineUsers.keys()
          )
        );
      }, 5000);
    }
  }
);
  }
);

/*
========================================
START SERVER
========================================
*/

const PORT = config.port;

server.listen(PORT, () => {
  console.log(
    `Auth Service running on port ${PORT}`
  );
});

export default app;