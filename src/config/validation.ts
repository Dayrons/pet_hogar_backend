import * as z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('30d'),
  API_URL: z.string().default('http://localhost:3000'),
  ODOO_BASE_URL: z.string().url().default('http://10.10.10.85:8060'),
  ODOO_DB: z.string().default('odoov17'),
  ODOO_USER: z.string().default('admin'),
  ODOO_PASSWORD: z.string().default('admin'),
});

export type Env = z.infer<typeof envSchema>;
