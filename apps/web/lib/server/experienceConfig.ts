import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "@salora/backend/database/rls-context";
import { defaultExperienceConfiguration, EXPERIENCE_PUBLISHED_KEY, parseExperienceConfiguration } from "@/lib/experience/config";

export async function getPublishedExperienceConfiguration() {
  if (!process.env.DATABASE_URL) return defaultExperienceConfiguration;

  try {
    const row = await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (db) => db.runtimeConfiguration.findUnique({
      where: { scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_PUBLISHED_KEY } }
    }));
    return row?.isActive ? parseExperienceConfiguration(row.value) : defaultExperienceConfiguration;
  } catch {
    return defaultExperienceConfiguration;
  }
}
