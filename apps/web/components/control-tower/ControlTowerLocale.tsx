"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ControlTowerLocale = "ar" | "en";

const arabic: Record<string, string> = {
  "Skip to control tower content": "انتقل إلى محتوى لوحة التحكم",
  "Control Tower": "منصة التحكم",
  "Overview": "نظرة عامة",
  "Today": "اليوم",
  "Products": "الأصناف",
  "Today at SALORA": "اليوم في سالورا",
  "A clear view of what needs your attention now.": "ملخص واضح لما يحتاج انتباهك الآن.",
  "Control how SALORA appears across the website, menu and mobile experience.": "تحكم في ظهور سالورا عبر الموقع والمنيو وتجربة الهاتف.",
  "Manage products, prices, images, availability and publishing from one place.": "أدر الأصناف والأسعار والصور والتوفر والنشر من مكان واحد.",
  "Experience": "التجربة",
  "Commerce": "التجارة",
  "Growth": "النمو",
  "Menu": "القائمة",
  "Analytics": "التحليلات",
  "Good morning, this is SALORA today": "صباح الخير، هذه سالورا اليوم",
  "Workspace scope": "نطاق مساحة العمل",
  "Only current, permission-backed capabilities are available here.": "تظهر هنا فقط الإمكانات الحالية المدعومة بصلاحيات واضحة.",
  "Actions are authenticated, validated, authorized and audited by the existing services.": "تمر الإجراءات عبر خدمات المصادقة والتحقق والصلاحيات والتدقيق الحالية.",
  "Operations": "العمليات",
  "Content": "المحتوى",
  "Channels": "القنوات",
  "System": "النظام",
  "Executive": "الإدارة التنفيذية",
  "Revenue": "الإيرادات",
  "Orders": "الطلبات",
  "Inventory": "المخزون",
  "Customers": "العملاء",
  "Loyalty": "الولاء",
  "AI": "الذكاء الاصطناعي",
  "WhatsApp": "واتساب",
  "Instagram": "إنستغرام",
  "Notifications": "الإشعارات",
  "Automation": "الأتمتة",
  "Integrations": "التكاملات",
  "Settings": "الإعدادات",
  "CUSTOMER": "عميل",
  "STAFF": "موظف",
  "MANAGER": "مدير",
  "ADMIN": "مدير النظام",
  "Team member": "عضو الفريق",
  "Primary navigation": "التنقل الرئيسي",
  "Workspace": "مساحة العمل",
  "Sign out": "تسجيل الخروج",
  "Search or run a command": "ابحث أو نفّذ أمرًا",
  "Search and commands": "البحث والأوامر",
  "No-Code Commerce Operating System": "نظام تشغيل تجاري متكامل دون برمجة",
  "Search-ready surface": "واجهة جاهزة للبحث",
  "Live": "مباشر",
  "Configured": "مُهيأ",
  "Needs backend": "يتطلب استكمالًا تقنيًا",
  "Restricted": "مقيّد",
  "RBAC write gates": "صلاحيات كتابة محمية",
  "Executive dashboards": "لوحات المؤشرات التنفيذية",
  "Customer menu": "قائمة العملاء",
  "Admin": "مدير النظام",
  "Role-gated session": "جلسة محمية بالصلاحيات",
  "Expand Control Tower navigation": "توسيع قائمة منصة التحكم",
  "Collapse Control Tower navigation": "طي قائمة منصة التحكم",
  "Open navigation": "فتح قائمة التنقل",
  "Close navigation": "إغلاق قائمة التنقل",
  "Control Tower navigation": "تنقل منصة التحكم",
  "Control Tower sections": "أقسام منصة التحكم",
  "Mobile Control Tower navigation": "تنقل منصة التحكم للجوال",
  "Control Tower Section": "قسم منصة التحكم",
  "Capabilities": "الإمكانات",
  "No-Code Workspace": "مساحة عمل دون برمجة",
  "No-code workspace": "مساحة عمل دون برمجة",
  "Live capabilities use existing SALORA APIs. Pending capabilities are modeled without claiming production readiness.": "الإمكانات المباشرة تستخدم واجهات SALORA الفعلية. وتظهر الإمكانات غير المكتملة بوضوح دون الادعاء بأنها جاهزة للإنتاج.",
  "Operator-first controls for the selected business capability. Live write actions remain protected by existing RBAC permissions.": "أدوات عملية للتحكم في المجال المحدد، مع حماية جميع عمليات الحفظ بصلاحيات الوصول المعتمدة.",
  "This workspace is modeled in the Control Tower and ready for persistent backend activation. It is intentionally not marked live until the domain API, audit trail, and rollback contract exist.": "تم تصميم هذه المساحة داخل منصة التحكم، ولن تُصنّف كمباشرة حتى يكتمل ربط واجهة البيانات وسجل التدقيق وخطة التراجع.",
  "Single source of truth for operating health, decisions, risk, and executive visibility.": "مصدر موحد لصحة التشغيل والقرارات والمخاطر والرؤية التنفيذية.",
  "Pricing, payment health, revenue intelligence, refunds, campaigns, and offers.": "الأسعار وحالة المدفوعات وتحليلات الإيرادات والاستردادات والحملات والعروض.",
  "Order lifecycle, queue visibility, assistance, and exception workflows.": "دورة حياة الطلبات ومراقبة قوائم الانتظار والمساعدة ومعالجة الاستثناءات.",
  "Ingredients, stock movement, reorder risk, and product availability control.": "المكونات وحركة المخزون ومخاطر إعادة الطلب والتحكم في توفر الأصناف.",
  "Customer health, segments, preferences, retention, and lifecycle actions.": "صحة العملاء وشرائحهم وتفضيلاتهم والاحتفاظ بهم وإجراءات دورة الحياة.",
  "Points, rewards, tiers, eligibility, and loyalty automations.": "النقاط والمكافآت والمستويات والاستحقاق وأتمتة الولاء.",
  "Providers, models, routing, fallback, safety, prompts, recommendations, and cost limits.": "المزودون والنماذج والتوجيه والبدائل والسلامة والتعليمات والتوصيات وحدود التكلفة.",
  "Templates, flows, auto replies, concierge, order assistance, loyalty assistance, and broadcasts.": "القوالب والتدفقات والردود الآلية والمساعد وخدمة الطلبات والولاء والحملات الجماعية.",
  "Draft captions, post ideas, schedules, approval status, and Meta publishing readiness for @salora.cafe.": "مسودات المنشورات والأفكار والجداول والموافقات وجاهزية النشر عبر Meta لحساب @salora.cafe.",
  "Email, SMS, push, in-app messages, templates, and delivery queues.": "البريد والرسائل النصية والإشعارات ورسائل التطبيق والقوالب وقوائم الإرسال.",
  "Headless CMS for pages, sections, banners, promotions, menus, categories, products, and landing pages.": "إدارة متكاملة للصفحات والأقسام واللافتات والعروض والقوائم والفئات والأصناف وصفحات الهبوط.",
  "Visual trigger, condition, and action workflows for no-code operations.": "تدفقات مرئية للمحفزات والشروط والإجراءات دون برمجة.",
  "Connector registry, credential vault, health monitor, and provider activation.": "سجل الموصلات وخزنة بيانات الاعتماد ومراقبة الصحة وتفعيل المزودين.",
  "Tenants, roles, permissions, theme, navigation, feature flags, governance, and rollout control.": "المنشآت والأدوار والصلاحيات والهوية والتنقل والميزات والحوكمة والتحكم في الإطلاق.",
  "Product operations": "إدارة الأصناف",
  "Product media command": "إدارة صور الأصناف",
  "CMS lifecycle": "دورة حياة المحتوى",
  "AI intelligence": "مركز ذكاء الأعمال",
  "AI product drafts": "مسودات الأصناف بالذكاء الاصطناعي",
  "Revenue intelligence": "تحليلات الإيرادات",
  "Simple launch offers": "عروض الإطلاق",
  "COD order queue": "طلبات الدفع عند الاستلام",
  "Stripe payment mode": "وضع دفع Stripe",
  "Inventory movement": "حركة المخزون",
  "Availability rules": "قواعد التوفر",
  "Customer intelligence": "ذكاء العملاء",
  "Lifecycle campaigns": "حملات دورة حياة العميل",
  "Award loyalty points": "منح نقاط الولاء",
  "Rule builder": "منشئ قواعد الولاء",
  "Webhook platform": "منصة Webhook",
  "Command drafts": "مسودات الأوامر",
  "Content drafts": "مسودات المحتوى",
  "Meta Graph readiness": "جاهزية Meta Graph",
  "Queue notification": "إضافة إشعار إلى قائمة الإرسال",
  "Template lifecycle": "دورة حياة القوالب",
  "Recipe catalog": "مكتبة الأتمتة",
  "Execution engine": "محرك التنفيذ",
  "Provider architecture": "بنية المزودين",
  "Credential vault UI": "خزنة بيانات الاعتماد",
  "RBAC foundation": "أساس الصلاحيات",
  "Runtime configuration API": "إعدادات التشغيل",
  "Feature flags and governance logs": "الميزات وسجلات الحوكمة",
  "Runtime activation governance": "حوكمة تفعيل الخدمات",
  "Multi-tenant config": "إدارة المنشآت المتعددة",
  "Catalog": "دليل الأصناف",
  "CMS + Revenue": "المحتوى والإيرادات",
  "Executive Intelligence": "الذكاء التنفيذي",
  "Governance": "الحوكمة",
  "Revenue Platform": "منصة الإيرادات",
  "Platform": "المنصة",
  "Security": "الأمان",
  "Marketing": "التسويق",
  "Messaging": "المراسلات",
  "Omnichannel": "القنوات الموحدة",
  "Products, categories, status, price, and image URL management are connected to Supabase.": "إدارة الأصناف والفئات والحالة والسعر وروابط الصور متصلة مباشرة بقاعدة Supabase.",
  "Media drafts, approval, primary image, archive, and publish workflow are Control Tower governed.": "مسودات الصور والموافقة والصورة الأساسية والأرشفة والنشر محكومة بالكامل من منصة التحكم.",
  "Advanced page and banner lifecycle remains postponed for Simple Launch.": "تحتاج دورة حياة الصفحات والبنرات المتقدمة إلى استكمال الربط التشغيلي قبل تفعيلها.",
  "Products, categories, status, price, and image URL management": "إدارة الأصناف والفئات والحالة والسعر والصور",
  "Control Tower commands": "أوامر منصة التحكم",
  "Open product manager": "فتح إدارة الأصناف",
  "Manage product media": "إدارة صور الأصناف",
  "Open content studio": "فتح استوديو المحتوى",
  "Open workspace": "فتح مساحة العمل",
  "Not available yet": "غير متاح بعد",
  "Pages, navigation, banners, campaigns, approvals, scheduling and rollback are managed from the content studio.": "تُدار الصفحات والتنقل والبنرات والحملات والموافقات والجدولة واستعادة الإصدارات من استوديو المحتوى."
};

type LocaleContextValue = {
  locale: ControlTowerLocale;
  isArabic: boolean;
  setLocale: (locale: ControlTowerLocale) => void;
  tr: (value: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function ControlTowerLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ControlTowerLocale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("salora-control-tower-locale");
    if (saved === "ar" || saved === "en") {
      const timer = window.setTimeout(() => setLocale(saved), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    window.localStorage.setItem("salora-control-tower-locale", locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    isArabic: locale === "ar",
    setLocale,
    tr: (text) => locale === "ar" ? (arabic[text] ?? text) : text
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useControlTowerLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useControlTowerLocale must be used inside ControlTowerLocaleProvider");
  return value;
}
