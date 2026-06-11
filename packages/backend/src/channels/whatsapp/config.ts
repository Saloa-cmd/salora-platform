import { z } from "zod";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const whatsappEnvSchema = z.object({
  WHATSAPP_ENABLED: z.enum(["true", "false"]).default("false"),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WABA_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v23.0")
});

export type WhatsAppEnv = z.infer<typeof whatsappEnvSchema>;

export function getWhatsAppEnv(): WhatsAppEnv {
  const parsed = whatsappEnvSchema.safeParse(runtimeEnv);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`SALORA WhatsApp env invalid: ${message}`);
  }
  return parsed.data;
}

export function whatsappEnabled(): boolean {
  return getWhatsAppEnv().WHATSAPP_ENABLED === "true";
}

export function assertWhatsAppReady(): WhatsAppEnv {
  const env = getWhatsAppEnv();
  if (env.WHATSAPP_ENABLED !== "true") {
    throw new Error("WhatsApp channel is disabled.");
  }

  const missing = [
    !env.WHATSAPP_ACCESS_TOKEN && "WHATSAPP_ACCESS_TOKEN",
    !env.WHATSAPP_PHONE_NUMBER_ID && "WHATSAPP_PHONE_NUMBER_ID",
    !env.WHATSAPP_VERIFY_TOKEN && "WHATSAPP_VERIFY_TOKEN"
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`WhatsApp channel missing required values: ${missing.join(", ")}`);
  }

  return env;
}
