import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  const isProd = process.env.NODE_ENV === "production";
  
  io = new Server(server, {
    cors: {
      origin: isProd ? process.env.CORS_ORIGIN : "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    try {
      // Verify JWT — do not trust userId from query string (easily spoofed)
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) throw new Error("No token");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const safeUserId = decoded.id;
      
      socket.join(`user_${safeUserId}`);
      if (!isProd) console.log(`Socket connected: user_${safeUserId}`);
    } catch {
      // Invalid or missing token — disconnect immediately
      socket.disconnect(true);
      return;
    }
    
    socket.on("disconnect", () => {
      if (!isProd) console.log("Socket disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
