/**
 * This module MUST be imported before anything that reads process.env at
 * import time (e.g. app.js checks NODE_ENV).  ES module import ordering
 * guarantees that this file's body executes first.
 */
import dotenv from "dotenv";
dotenv.config();
