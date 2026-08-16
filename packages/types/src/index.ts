export type ProductCategory = string;

export type OrderType = "Counter" | "Car" | "DineIn" | "Gift";

export interface Product {
  id: string;
  catalogId?: string;
  menuRevisionId?: string;
  sectionKey?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  category: ProductCategory;
  categoryAr?: string;
  categoryEn?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  story?: string;
  price: number;
  tags: string[];
  pairing?: string;
  visual: string;
  featured?: boolean;
  badges?: string[];
  nutrition?: ProductNutritionSummary;
  allergens?: ProductAllergenSummary;
  variants?: ProductChoice[];
  addons?: ProductChoice[];
  modifierGroups?: ProductModifierGroup[];
}

export interface ProductChoice {
  id: string;
  name: string;
  priceDelta: number;
  sku?: string;
}

export interface ProductModifierGroup {
  id: string;
  name: string;
  required: boolean;
  options: ProductChoice[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  key?: string;
  product: Product;
  quantity: number;
  unitPrice?: number;
  modifiers?: SelectedModifier[];
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  orderType: OrderType;
  notes?: string;
}

export interface OrderDraft extends CheckoutCustomer {
  items: CartItem[];
  total: number;
}

export interface ConciergeReply {
  message: string;
  productIds: string[];
  pairing?: string;
  intent: "cold" | "sweet" | "pairing" | "light" | "matcha" | "unsure";
  quickReplies?: string[];
}

export interface ProductNutritionSummary {
  caloriesKcal?: number;
  proteinG?: number;
  carbohydratesG?: number;
  totalSugarG?: number;
  fatG?: number;
  verificationStatus: "VERIFIED";
}

export interface ProductAllergenSummary {
  contains: string[];
  mayContain: string[];
  warningAr?: string;
  warningEn?: string;
  verificationStatus: "VERIFIED";
}

export type MenuAuthoritySource = "published-revision" | "legacy-catalog";

export interface MenuAuthoritySection {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  sortOrder: number;
}

export interface MenuAuthoritySnapshot {
  collection: {
    id: string;
    key: string;
    slug: string;
    kind: string;
    nameAr: string;
    nameEn: string;
  };
  revision: {
    id: string;
    version: number;
    checksum: string;
    publishedAt: string;
  } | null;
  sections: MenuAuthoritySection[];
  products: Product[];
  source: MenuAuthoritySource;
  stale: boolean;
  runtimeMode: "live" | "compatibility" | "offline-cache";
  databaseHealth: "available" | "unavailable";
  generatedAt: string;
}

export type ExperienceLayout = "grid" | "list" | "editorial";
export type ExperienceCardRatio = "landscape" | "square" | "portrait";
export type ExperienceBannerPlacement = "home" | "menu" | "both";

export interface ExperienceBanner {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  imageUrl: string;
  linkUrl: string;
  placement: ExperienceBannerPlacement;
  active: boolean;
  sortOrder: number;
}

export interface ExperienceConfiguration {
  schemaVersion: 1;
  brandKey: "SALORA";
  theme: {
    primaryColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedColor: string;
    borderRadius: number;
    fontFamily: "sans" | "serif" | "modern";
  };
  menu: {
    layout: ExperienceLayout;
    columns: 2 | 3 | 4;
    cardRatio: ExperienceCardRatio;
    showImages: boolean;
    showDescriptions: boolean;
    showSearch: boolean;
    showCategories: boolean;
  };
  site: {
    logoUrl: string;
    heroTitleAr: string;
    heroTitleEn: string;
    heroSubtitleAr: string;
    heroSubtitleEn: string;
    announcementAr: string;
    announcementEn: string;
    showAnnouncement: boolean;
  };
  app: {
    compactCards: boolean;
    showOrdering: boolean;
    showRecommendations: boolean;
    navigationStyle: "tabs" | "cards";
  };
  banners: ExperienceBanner[];
}

export type ExperiencePlatform = "web" | "mobile" | "digital-menu";
export type ExperienceRevisionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "SUPERSEDED";
export type ExperienceThemeMode = "dark" | "light" | "system";
export type ExperienceSectionWidth = "full" | "wide" | "content" | "compact";
export type ExperienceSpacing = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type ExperienceAlignment = "start" | "center" | "end";
export type ExperienceSurface = "background" | "surface" | "elevated" | "brand" | "hero";

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface ExperienceAction {
  label: LocalizedText;
  destination: string;
  icon?: SaloraSemanticIconName;
  external?: boolean;
}

export type SaloraSemanticIconName =
  | "ai" | "analytics" | "assets" | "back" | "bell" | "brand" | "car" | "cart"
  | "check" | "close" | "coffee" | "dashboard" | "dineIn" | "forward" | "gift"
  | "history" | "language" | "location" | "menu" | "mobile" | "navigation" | "orders"
  | "pages" | "preview" | "publish" | "revision" | "search" | "settings" | "sparkles"
  | "store" | "theme" | "user" | "whatsapp";

export interface ExperienceResponsiveSettings {
  hiddenOn?: ExperiencePlatform[];
  width: ExperienceSectionWidth;
  spacing: ExperienceSpacing;
  alignment: ExperienceAlignment;
  surface: ExperienceSurface;
}

interface ExperienceSectionBase {
  id: string;
  componentVersion: 1;
  visible: boolean;
  responsive: ExperienceResponsiveSettings;
}

export interface HeroLuxurySection extends ExperienceSectionBase {
  componentId: "hero.luxury.v1";
  variant: "split" | "editorial";
  content: {
    title: LocalizedText;
    subtitle: LocalizedText;
    imageAssetId?: string;
    primaryAction: ExperienceAction;
    secondaryAction?: ExperienceAction;
  };
}

export interface ProductGridPremiumSection extends ExperienceSectionBase {
  componentId: "menu.product-grid.premium.v1";
  variant: "grid" | "editorial" | "list";
  content: {
    heading: LocalizedText;
    description?: LocalizedText;
    source: "menu-authority-adapter";
    categoryKey?: string;
    featuredOnly: boolean;
    maxItems: number;
  };
}

export interface StoryEditorialSection extends ExperienceSectionBase {
  componentId: "story.editorial.v1";
  variant: "image-start" | "image-end" | "text-only";
  content: { heading: LocalizedText; body: LocalizedText; imageAssetId?: string; action?: ExperienceAction };
}

export interface LocationMapCardSection extends ExperienceSectionBase {
  componentId: "location.map-card.v1";
  variant: "split" | "compact";
  content: { heading: LocalizedText; address: LocalizedText; hours: LocalizedText; latitude: number; longitude: number; action: ExperienceAction };
}

export interface CtaGoldSection extends ExperienceSectionBase {
  componentId: "cta.gold.v1";
  variant: "solid" | "outline";
  content: { heading: LocalizedText; body?: LocalizedText; action: ExperienceAction };
}

export type ExperienceSectionV2 = HeroLuxurySection | ProductGridPremiumSection | StoryEditorialSection | LocationMapCardSection | CtaGoldSection;

export interface ExperiencePlatformOverride {
  hiddenSectionIds?: string[];
  sectionOrder?: string[];
}

export interface ExperiencePageV2 {
  schemaVersion: 2;
  brandKey: "SALORA";
  id: string;
  slug: string;
  version: number;
  status: ExperienceRevisionStatus;
  title: LocalizedText;
  defaultTheme: ExperienceThemeMode;
  sections: ExperienceSectionV2[];
  platformOverrides?: Partial<Record<ExperiencePlatform, ExperiencePlatformOverride>>;
}
