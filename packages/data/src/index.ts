import { saloraRuntime } from "@salora/config";
import type { CartItem, CheckoutCustomer, ConciergeReply, OrderDraft, Product } from "@salora/types";

export const products: Product[] = [
  {
    id: "iced-matcha-vanilla",
    name: "Iced Matcha Vanilla",
    category: "Matcha",
    description: "Ceremonial matcha folded with vanilla cream over ice for a soft signature finish.",
    story: "A chilled house ritual for guests who want matcha to feel polished, generous, and quietly memorable.",
    price: 2.9,
    tags: ["cold", "sweet", "signature"],
    pairing: "Saffron Milk Cake",
    visual: "matcha-vanilla",
    featured: true
  },
  {
    id: "ceremonial-matcha",
    name: "Ceremonial Matcha",
    category: "Matcha",
    description: "Pure, bright ceremonial matcha prepared with calm texture and a clean finish.",
    story: "For the guest who wants clarity over sweetness: clean matcha, calm texture, no noise.",
    price: 2.7,
    tags: ["light", "pure", "premium"],
    pairing: "Strawberry Matcha Cream",
    visual: "ceremonial-matcha",
    featured: true
  },
  {
    id: "spanish-latte",
    name: "Spanish Latte",
    category: "Coffee",
    description: "A creamy espresso classic with a rounded sweetness and velvet mouthfeel.",
    story: "The familiar favorite, tuned for SALORA: smooth, creamy, and easy to love.",
    price: 2.6,
    tags: ["sweet", "creamy", "bestseller"],
    pairing: "Tiramisu Cup",
    visual: "spanish-latte",
    featured: true
  },
  {
    id: "pistachio-latte",
    name: "Pistachio Latte",
    category: "Coffee",
    description: "Espresso, steamed milk, and pistachio notes for a warm luxury profile.",
    story: "A slower, richer coffee moment with pistachio warmth and dessert-like comfort.",
    price: 3.1,
    tags: ["sweet", "nutty", "luxury"],
    pairing: "Chocolate Cloud Dessert",
    visual: "pistachio-latte"
  },
  {
    id: "signature-cold-brew",
    name: "Signature Cold Brew",
    category: "Coffee",
    description: "Slow-steeped cold brew with bold clarity, low acidity, and a clean finish.",
    story: "Built for focus: cold, bold, and light enough to carry a productive afternoon.",
    price: 2.8,
    tags: ["cold", "bold", "light"],
    pairing: "Tiramisu Cup",
    visual: "cold-brew",
    featured: true
  },
  {
    id: "saffron-milk-cake",
    name: "Saffron Milk Cake",
    category: "Dessert",
    description: "A fragrant milk cake with saffron warmth, soft cream, and a boutique finish.",
    story: "A soft, aromatic dessert that turns a matcha order into a complete SALORA table.",
    price: 2.4,
    tags: ["creamy", "luxury", "pairing"],
    visual: "saffron-cake"
  },
  {
    id: "tiramisu-cup",
    name: "Tiramisu Cup",
    category: "Dessert",
    description: "Coffee-soaked layers, mascarpone cream, and cocoa in an elegant single serve cup.",
    story: "A classic coffee dessert served as a neat companion to cold brew or Spanish latte.",
    price: 2.3,
    tags: ["coffee", "creamy", "classic"],
    visual: "tiramisu-cup"
  },
  {
    id: "chocolate-cloud-dessert",
    name: "Chocolate Cloud Dessert",
    category: "Dessert",
    description: "A rich chocolate dessert with airy texture, deep cocoa, and polished finish.",
    story: "A high-comfort dessert with a light finish, designed for guests who want indulgence without heaviness.",
    price: 2.6,
    tags: ["chocolate", "rich", "premium"],
    visual: "chocolate-cloud"
  },
  {
    id: "strawberry-matcha-cream",
    name: "Strawberry Matcha Cream",
    category: "Dessert",
    description: "Soft cream, strawberry brightness, and matcha notes built for gentle pairing.",
    story: "A soft matcha-dessert bridge for guests who want something fresh, gentle, and photogenic.",
    price: 2.5,
    tags: ["matcha", "strawberry", "soft"],
    visual: "strawberry-matcha"
  }
];

export const categories = ["All", "Matcha", "Coffee", "Dessert"] as const;

const defaultQuickReplies = ["cold", "sweet", "light", "dessert pairing", "matcha"];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function recommendFromPrompt(prompt: string): ConciergeReply {
  const text = prompt.toLowerCase();

  if (text.includes("pair") || text.includes("dessert")) {
    return {
      message: "For a complete SALORA moment, I would pair a chilled signature with a soft dessert.",
      productIds: ["iced-matcha-vanilla", "saffron-milk-cake", "signature-cold-brew", "tiramisu-cup"],
      pairing: "Iced Matcha Vanilla + Saffron Milk Cake or Signature Cold Brew + Tiramisu Cup",
      intent: "pairing",
      quickReplies: ["matcha pairing", "coffee pairing", "something lighter"]
    };
  }

  if (text.includes("matcha")) {
    return {
      message: "Matcha is the house signature. These keep the profile refined, fresh, and memorable.",
      productIds: ["ceremonial-matcha", "iced-matcha-vanilla", "strawberry-matcha-cream"],
      intent: "matcha",
      quickReplies: ["cold matcha", "light matcha", "dessert pairing"]
    };
  }

  if (text.includes("cold") || text.includes("iced")) {
    return {
      message: "For something cold, I would keep it crisp and elegant.",
      productIds: ["iced-matcha-vanilla", "signature-cold-brew"],
      intent: "cold",
      quickReplies: ["make it sweet", "pair dessert", "lighter choice"]
    };
  }

  if (text.includes("sweet") || text.includes("creamy")) {
    return {
      message: "For a sweet mood, these are smooth, generous, and still polished.",
      productIds: ["spanish-latte", "pistachio-latte"],
      intent: "sweet",
      quickReplies: ["add dessert", "coffee only", "matcha instead"]
    };
  }

  if (text.includes("light") || text.includes("pure")) {
    return {
      message: "For a lighter choice, I would avoid heavy sweetness and keep the finish clean.",
      productIds: ["ceremonial-matcha", "signature-cold-brew"],
      intent: "light",
      quickReplies: ["cold", "pure matcha", "with dessert"]
    };
  }

  return {
    message: "Would you like something cold, sweet, light, or dessert-paired?",
    productIds: [],
    intent: "unsure",
    quickReplies: defaultQuickReplies
  };
}

export function calculateSubtotal(items: CartItem[]): number {
  return Number(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(3));
}

export function formatOmr(value: number): string {
  return `OMR ${value.toFixed(3)}`;
}

export function generateWhatsAppMessage(order: OrderDraft): string {
  const orderTypes: Record<OrderDraft["orderType"], string> = {
    Counter: "استلام من الكاونتر",
    Car: "استلام بالسيارة أمام البحر",
    DineIn: "داخل سالورا",
    Gift: "هدية لشخص آخر"
  };
  const itemLines = order.items.map((item) => `• ${item.quantity} × ${item.product.name} — ${formatOmr(item.product.price * item.quantity)}`).join("\n");
  return `طلب جديد من SALORA

الاسم: ${order.name}
الهاتف: ${order.phone}
طريقة الاستلام: ${orderTypes[order.orderType]}

الطلب:
${itemLines}

الإجمالي: ${formatOmr(order.total)}

الملاحظات:
${order.notes?.trim() || "لا توجد ملاحظات"}`;
}

export function generateWhatsAppUrl(order: OrderDraft, number = saloraRuntime.whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(generateWhatsAppMessage(order))}`;
}

export function createOrderDraft(customer: CheckoutCustomer, items: CartItem[]): OrderDraft {
  return {
    ...customer,
    items,
    total: calculateSubtotal(items)
  };
}
