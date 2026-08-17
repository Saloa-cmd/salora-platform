import { Ionicons } from "@expo/vector-icons";
import { I18nManager } from "react-native";
import type { ComponentProps } from "react";
import type { SaloraSemanticIconName } from "@salora/types";
import { saloraIconMetadata } from "@salora/ui";

export type SaloraMobileIconName = SaloraSemanticIconName;

const iconNames: Record<SaloraMobileIconName, ComponentProps<typeof Ionicons>["name"]> = {
  ai: "sparkles-outline", analytics: "bar-chart-outline", assets: "images-outline", back: "chevron-back", bell: "notifications-outline", brand: "color-wand-outline",
  car: "car-outline", cart: "bag-handle-outline", check: "checkmark-circle-outline", close: "close-outline", coffee: "cafe-outline", dashboard: "grid-outline",
  dineIn: "restaurant-outline", forward: "chevron-forward", gift: "gift-outline", history: "time-outline", language: "language-outline", location: "location-outline",
  menu: "menu-outline", mobile: "phone-portrait-outline", navigation: "navigate-outline", orders: "cube-outline", pages: "albums-outline", preview: "eye-outline",
  publish: "rocket-outline", revision: "document-text-outline", search: "search-outline", settings: "settings-outline", sparkles: "sparkles-outline",
  store: "storefront-outline", theme: "contrast-outline", user: "person-outline", whatsapp: "chatbubble-ellipses-outline"
};

export function SaloraIcon({ name, size = 20, color = "#F5EFE3", label, decorative = !label }: { name: SaloraMobileIconName; size?: number; color?: string; label?: string; decorative?: boolean }) {
  const metadata = saloraIconMetadata[name];
  return <Ionicons name={iconNames[name]} size={size} color={color} accessibilityLabel={decorative ? undefined : label ?? metadata.label.ar} accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? "no-hide-descendants" : "auto"} style={metadata.directional && I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />;
}
