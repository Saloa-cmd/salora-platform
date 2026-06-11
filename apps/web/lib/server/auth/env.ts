import { z } from "zod";

const authEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  AUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30)
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export function getAuthEnv(): AuthEnv {
  const parsed = authEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`SALORA auth environment is invalid: ${issues}`);
  }

  return parsed.data;
}
