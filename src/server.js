/* env.js MUST be the first import */
import "./env.js";

import http from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";
import connectDB from "./config/db.js";
import { runExpiryJob } from "./utils/expiryJob.js";

/* ── environment validation ── */

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required environment variable(s): ${missing.join(", ")}`);
  console.error("   Set them in your .env file or host environment, then restart.");
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 16) {
  console.error("❌ JWT_SECRET must be at least 16 characters for security.");
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;

/* ── create server with socket.io ── */
const server = http.createServer(app);
const io = initSocket(server);

/* ── connect to database ── */
connectDB();

/* ── start HTTP server ── */
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (!isProd) {
    console.log(
      `Server running on http://127.0.0.1:${PORT} [${process.env.NODE_ENV || "development"}]`
    );
  }
  runExpiryJob().catch((err) => {
    if (!isProd) {
      console.error("Initial expiry job failed:", err.message);
    }
  });
});