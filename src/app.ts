// src/app.ts
import express from "express";
import cors from "cors";
import { getEnv, corsOriginList } from "./config/env.js";

const env = getEnv();
const app = express();

app.use(cors({ origin: corsOriginList(env), credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;

