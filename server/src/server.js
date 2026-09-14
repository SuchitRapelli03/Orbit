import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { createSocketServer } from "./socket/index.js";

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = createSocketServer(server);
app.set("io", io);

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/orbit")
  .then(() => {
    server.listen(port, () => console.log(`Orbit API listening on ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
