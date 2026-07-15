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
}

export interface CartItem {
  product: Product;
  quantity: number;
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
