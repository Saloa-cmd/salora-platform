export type ProductCategory = string;

export type OrderType = "Counter" | "Car" | "DineIn" | "Gift";

export interface Product {
  id: string;
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
