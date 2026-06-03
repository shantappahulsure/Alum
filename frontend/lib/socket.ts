"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket;

if (typeof window !== "undefined") {
  socket = io(
    process.env.NEXT_PUBLIC_API_URL!,
    {
      transports: ["websocket"],

      autoConnect: false,

      reconnection: true,

      reconnectionAttempts: 10,

      reconnectionDelay: 1000,
    }
  );
}

export { socket };