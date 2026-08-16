import {
  BarChart3, Bell, Bot, Car, Check, ChevronLeft, ChevronRight, Coffee, FileClock, Gift, Globe2,
  History, Image, LayoutDashboard, MapPin, Menu, MessageCircle, MonitorSmartphone, Navigation, Package, Palette,
  PanelsTopLeft, Rocket, Search, Settings, ShoppingBag, Sparkles, Store, User, UtensilsCrossed,
  WandSparkles, X, type LucideIcon
} from "lucide-react";
import type { SaloraSemanticIconName } from "@salora/types";
import { saloraIconMetadata } from "@salora/ui";

export const SALORA_ICON_REGISTRY: Readonly<Record<SaloraSemanticIconName, LucideIcon>> = {
  ai: Bot, analytics: BarChart3, assets: Image, back: ChevronLeft, bell: Bell, brand: WandSparkles,
  car: Car, cart: ShoppingBag, check: Check, close: X, coffee: Coffee, dashboard: LayoutDashboard,
  dineIn: UtensilsCrossed, forward: ChevronRight, gift: Gift, history: History, language: Globe2,
  location: MapPin, menu: Menu, mobile: MonitorSmartphone, navigation: Navigation, orders: Package,
  pages: PanelsTopLeft, preview: MonitorSmartphone, publish: Rocket, revision: FileClock, search: Search,
  settings: Settings, sparkles: Sparkles, store: Store, theme: Palette, user: User, whatsapp: MessageCircle
};

export const SALORA_ICON_NAMES = Object.freeze(Object.keys(SALORA_ICON_REGISTRY) as SaloraSemanticIconName[]);
export const SALORA_ICON_METADATA: Readonly<Record<SaloraSemanticIconName, (typeof saloraIconMetadata)[SaloraSemanticIconName]>> = saloraIconMetadata;
