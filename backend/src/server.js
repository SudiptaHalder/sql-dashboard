import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import configRoutes from "./routes/configRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ESM + Node v22
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env correctly
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Loaded ENCRYPTION_KEY:", process.env.ENCRYPTION_KEY); // debug

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/config", configRoutes);

// WebSocket
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

// Start server
server.listen(3000, () => {
  console.log("Backend running http://localhost:3000");
});
