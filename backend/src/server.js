import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import configRoutes from "./routes/configRoutes.js";
import listener from "./binlog/listener.js";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: { origin: "*", credentials: true }
});

app.use("/api/config", configRoutes);

server.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
  listener.start(io);
});
