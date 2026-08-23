import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accessTokenCookieName } from "./cookies";
import { canAccessControlTower } from "./controlTowerAccess";
import { getAuthService } from "./runtime";
import type { RoleName } from "./types";

export async function requireControlTowerPageAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(accessTokenCookieName)?.value;

  if (!token) {
    redirect("/login?next=/control-tower/overview");
  }

  try {
    const payload = getAuthService().verifyAccessToken(token);
    const roles = payload.roles as RoleName[];

    if (!canAccessControlTower(roles)) {
      redirect("/dashboard?access=denied");
    }

    return payload;
  } catch {
    redirect("/login?next=/control-tower/overview");
  }
}
