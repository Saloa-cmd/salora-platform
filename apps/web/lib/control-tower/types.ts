import type { LucideIcon } from "lucide-react";

export type ControlTowerStatus = "live" | "configured" | "needs-backend" | "restricted";

export type ControlTowerSectionId =
  | "executive"
  | "revenue"
  | "orders"
  | "inventory"
  | "customers"
  | "loyalty"
  | "ai"
  | "whatsapp"
  | "instagram"
  | "notifications"
  | "content"
  | "automation"
  | "integrations"
  | "settings";

export type ControlCapability = {
  title: string;
  description: string;
  status: ControlTowerStatus;
  owner: string;
};

export type ControlTowerSection = {
  id: ControlTowerSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  capabilities: ControlCapability[];
};

export type NoCodeAction =
  | "product"
  | "inventory"
  | "loyalty"
  | "notification";

export type MutationState = {
  status: "idle" | "submitting" | "success" | "error" | "forbidden";
  message?: string;
  requestId?: string;
};
