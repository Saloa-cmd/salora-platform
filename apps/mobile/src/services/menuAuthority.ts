import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MenuAuthoritySnapshot } from "@salora/types";
import { saloraFetch } from "@/services/apiClient";

const CACHE_KEY = "salora.menu-authority.v2";

type AuthorityApiResponse = {
  data?: {
    collection: MenuAuthoritySnapshot["collection"];
    revision: MenuAuthoritySnapshot["revision"];
    sections: MenuAuthoritySnapshot["sections"];
    products: MenuAuthoritySnapshot["products"];
  };
  runtime?: {
    source?: MenuAuthoritySnapshot["source"];
    stale?: boolean;
    mode?: MenuAuthoritySnapshot["runtimeMode"];
    databaseHealth?: MenuAuthoritySnapshot["databaseHealth"];
    generatedAt?: string;
  };
  error?: string;
};

export type MobileMenuAuthority = MenuAuthoritySnapshot & {
  offline: boolean;
  revisionChanged: boolean;
};

async function cachedAuthority(): Promise<MenuAuthoritySnapshot | null> {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as MenuAuthoritySnapshot;
  } catch {
    await AsyncStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export async function loadMenuAuthority(force = false): Promise<MobileMenuAuthority> {
  const previous = await cachedAuthority();

  try {
    const response = await saloraFetch(`/api/v1/menu-authority${force ? "?refresh=1" : ""}`);
    const payload = await response.json() as AuthorityApiResponse;
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Menu authority request failed.");
    }

    const snapshot: MenuAuthoritySnapshot = {
      collection: payload.data.collection,
      revision: payload.data.revision,
      sections: payload.data.sections,
      products: payload.data.products,
      source: payload.runtime?.source ?? "published-revision",
      stale: Boolean(payload.runtime?.stale),
      runtimeMode: payload.runtime?.mode ?? "live",
      databaseHealth: payload.runtime?.databaseHealth ?? "available",
      generatedAt: payload.runtime?.generatedAt ?? new Date().toISOString()
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));

    return {
      ...snapshot,
      offline: false,
      revisionChanged: Boolean(previous?.revision?.id && previous.revision.id !== snapshot.revision?.id)
    };
  } catch (error) {
    if (!previous) throw error;
    return {
      ...previous,
      stale: true,
      runtimeMode: "offline-cache",
      databaseHealth: "unavailable",
      offline: true,
      revisionChanged: false
    };
  }
}

export async function clearMenuAuthorityCache() {
  await AsyncStorage.removeItem(CACHE_KEY);
}
