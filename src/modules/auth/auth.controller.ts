import type { Request, Response, CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../../config/env.js";
import { AppError } from "../../utils/Apperror.js";
import * as auth from "./auth.service.js";

const env = getEnv();

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/",
};

function setSession(res: Response, token: string) {
  const exp = (jwt.decode(token) as { exp?: number } | null)?.exp;
  const maxAge = exp ? exp * 1000 - Date.now() : undefined;
  res.cookie(env.JWT_COOKIE_NAME, token, { ...baseCookie, maxAge });
}

export async function register(req: Request, res: Response) {
  const { user, token } = await auth.registerUser(req.body);
  setSession(res, token);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const { user, token } = await auth.loginUser(req.body);
  setSession(res, token);
  res.json({ user });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.JWT_COOKIE_NAME, baseCookie);
  res.status(204).end();
}

export async function me(_req: Request, res: Response) {
  const user = await auth.getUserById(res.locals.userId);
  if (!user) throw new AppError(404, "User not found");
  res.json({ user });
}