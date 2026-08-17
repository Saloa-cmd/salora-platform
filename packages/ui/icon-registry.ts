export type SaloraIconCategory = "action" | "commerce" | "navigation" | "operations" | "status" | "system";
export interface SaloraIconMetadata { semanticName: string; label: { ar: string; en: string }; category: SaloraIconCategory; keywords: readonly string[]; directional: boolean; platforms: readonly ["web", "mobile"]; sizes: readonly [16, 20, 24] }
const icon = (semanticName: string, ar: string, en: string, category: SaloraIconCategory, directional = false): SaloraIconMetadata => ({ semanticName, label: { ar, en }, category, keywords: semanticName.split("."), directional, platforms: ["web", "mobile"], sizes: [16, 20, 24] });
export const saloraIconMetadata = {
  ai: icon("system.ai", "الذكاء الاصطناعي", "AI", "system"), analytics: icon("operations.analytics", "التحليلات", "Analytics", "operations"), assets: icon("operations.assets", "الأصول", "Assets", "operations"),
  back: icon("navigation.back", "رجوع", "Back", "navigation", true), bell: icon("status.notifications", "التنبيهات", "Notifications", "status"), brand: icon("system.brand", "الهوية", "Brand", "system"),
  car: icon("commerce.car-service", "السيارة", "Car service", "commerce"), cart: icon("commerce.cart", "السلة", "Cart", "commerce"), check: icon("status.success", "تم", "Complete", "status"), close: icon("action.close", "إغلاق", "Close", "action"),
  coffee: icon("commerce.product", "منتج", "Product", "commerce"), dashboard: icon("operations.dashboard", "لوحة التحكم", "Dashboard", "operations"), dineIn: icon("commerce.dine-in", "داخل المقهى", "Dine in", "commerce"),
  forward: icon("navigation.forward", "التالي", "Forward", "navigation", true), gift: icon("commerce.gift", "هدية", "Gift", "commerce"), history: icon("operations.history", "السجل", "History", "operations"),
  language: icon("system.language", "اللغة", "Language", "system"), location: icon("navigation.location", "الموقع", "Location", "navigation"), menu: icon("navigation.menu", "القائمة", "Menu", "navigation"),
  mobile: icon("system.mobile", "الموبايل", "Mobile", "system"), navigation: icon("navigation.routes", "التنقل", "Navigation", "navigation", true), orders: icon("commerce.orders", "الطلبات", "Orders", "commerce"),
  pages: icon("operations.pages", "الصفحات", "Pages", "operations"), preview: icon("operations.preview", "المعاينة", "Preview", "operations"), publish: icon("operations.publish", "النشر", "Publish", "operations"),
  revision: icon("operations.revision", "المراجعة", "Revision", "operations"), search: icon("action.search", "بحث", "Search", "action"), settings: icon("system.settings", "الإعدادات", "Settings", "system"),
  sparkles: icon("system.sparkles", "اقتراح", "Suggestion", "system"), store: icon("commerce.store", "المتجر", "Store", "commerce"), theme: icon("system.theme", "المظهر", "Appearance", "system"),
  user: icon("system.user", "المستخدم", "User", "system"), whatsapp: icon("commerce.whatsapp", "واتساب", "WhatsApp", "commerce")
} as const;
