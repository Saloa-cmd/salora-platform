export type ProductCategory = string;

export type OrderType = "Counter" | "Car" | "DineIn" | "Gift";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
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
