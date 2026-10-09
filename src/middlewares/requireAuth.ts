import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

const env = getEnv();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.JWT_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    res.locals.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}