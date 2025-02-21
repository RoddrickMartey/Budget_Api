import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/apiRoutes.js";

// Fix "__dirname" for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "https://budget-client-eight.vercel.app", // Change this to your frontend URL
    methods: "GET,POST,PATCH,DELETE",
    credentials: true, // Allow cookies/auth headers
  })
);

app.use(cookieParser());

// Ensure the "logs" folder exists before writing logs
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a write stream for logs
const logStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

// Middleware
app.use(express.json());

// Log both to file and console
app.use(morgan("combined", { stream: logStream })); // Logs to file
app.use(morgan("dev")); // Logs to console

// Routes
app.get("/", (req, res) => {
  res.send("RodCo Budget API is running...");
});

app.use("/api", apiRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
