import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export function loadDotEnv(): void {
  let dir = process.cwd();
  for (let i = 0; i < 4; i += 1) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_COOKIE_NAME: z.string().default('text-me_session'),
    PAYMENT_WEBHOOK_SECRET: z.string().min(8).optional(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    LOG_LEVEL: z.string().default('info'),
    COOKIE_SECURE: z
      .string()
      .default('false')
      .transform((v) => v === 'true'),
    API_PUBLIC_URL: z.string().default('http://localhost:3000'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.PAYMENT_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['PAYMENT_WEBHOOK_SECRET'],
        message: 'Required in production',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  loadDotEnv();
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function corsOriginList(env: Env): string[] {
  return env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
}