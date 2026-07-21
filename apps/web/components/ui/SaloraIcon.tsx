import {
  Bell,
  Bot,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Globe2,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
  type LucideIcon,
  type LucideProps
} from "lucide-react";

export type SaloraIconName =
  | "ai"
  | "back"
  | "bell"
  | "car"
  | "cart"
  | "check"
  | "close"
  | "coffee"
  | "dashboard"
  | "forward"
  | "gift"
  | "language"
  | "menu"
  | "orders"
  | "search"
  | "settings"
  | "sparkles"
  | "store"
  | "dineIn";

const icons: Record<SaloraIconName, LucideIcon> = {
  ai: Bot,
  back: ChevronLeft,
  bell: Bell,
  car: Car,
  cart: ShoppingBag,
  check: Check,
  close: X,
  coffee: Coffee,
  dashboard: LayoutDashboard,
  forward: ChevronRight,
  gift: Gift,
  language: Globe2,
  menu: Menu,
  orders: Package,
  search: Search,
  settings: Settings,
  sparkles: Sparkles,
  store: Store,
  dineIn: UtensilsCrossed
};

export function SaloraIcon({ name, "aria-hidden": ariaHidden = true, ...props }: LucideProps & { name: SaloraIconName }) {
  const Icon = icons[name];
  return <Icon aria-hidden={ariaHidden} strokeWidth={1.8} {...props} />;
}
