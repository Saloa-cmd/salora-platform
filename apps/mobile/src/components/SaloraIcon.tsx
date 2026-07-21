import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type SaloraMobileIconName = "back" | "cart" | "check" | "coffee" | "language" | "menu" | "search" | "sparkles";

const iconNames: Record<SaloraMobileIconName, ComponentProps<typeof Ionicons>["name"]> = {
  back: "chevron-back",
  cart: "bag-handle-outline",
  check: "checkmark-circle-outline",
  coffee: "cafe-outline",
  language: "language-outline",
  menu: "grid-outline",
  search: "search-outline",
  sparkles: "sparkles-outline"
};

export function SaloraIcon({ name, size = 20, color = "#F5EFE3" }: { name: SaloraMobileIconName; size?: number; color?: string }) {
  return <Ionicons name={iconNames[name]} size={size} color={color} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
