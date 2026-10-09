import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database.js";
import { getEnv } from "../../config/env.js";
import { AppError } from "../../utils/Apperror.js";

const env = getEnv();

const publicUser = { id: true, email: true, username: true, createdAt: true } as const;

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, 
  timeCost: 2,
  parallelism: 1,
} as const;

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { id: true },
  });
  if (existing) throw new AppError(409, "Person don use this email or username");

  const passwordHash = await argon2.hash(input.password, ARGON_OPTIONS);
  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
    select: publicUser,
  });
  return { user, token: signToken(user.id) };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  let ok = false;
  if (user) {
    try {
      ok = await argon2.verify(user.passwordHash, input.password);
    } catch {
      ok = false; 
    }
  }
  if (!user || !ok) throw new AppError(401, "Invalid email or password");

  const { passwordHash: _omit, ...safe } = user;
  return { user: safe, token: signToken(user.id) };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: publicUser });
}