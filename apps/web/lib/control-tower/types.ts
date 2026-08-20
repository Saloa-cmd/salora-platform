import type { SaloraSemanticIconName } from "@salora/types";

export type ControlTowerStatus = "live" | "configured" | "needs-backend" | "restricted";
export type ControlTowerSectionId = "overview" | "experience" | "menu" | "orders" | "customers" | "marketing" | "ai" | "analytics" | "operations" | "settings";
export type ControlCapability = { title: string; description: string; status: ControlTowerStatus; owner: string; href?: string; actionLabel?: string };
export type ControlTowerSection = { id: ControlTowerSectionId; label: string; description: string; icon: SaloraSemanticIconName; readPermission: string; commandLabel: string; keywords: readonly string[]; capabilities: ControlCapability[] };
export type NoCodeAction = "product" | "inventory" | "loyalty" | "notification";
export type MutationState = { status: "idle" | "submitting" | "success" | "error" | "forbidden"; message?: string; requestId?: string };
