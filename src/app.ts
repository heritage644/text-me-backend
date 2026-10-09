import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getEnv, corsOriginList } from "./config/env.js";
import { AppError } from "./utils/Apperror.js";
import authRoutes from "./modules/auth/auth.routes.js";

const env = getEnv();
const app = express();

app.use(cors({ origin: corsOriginList(env), credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// central error handler
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
);

export default app;