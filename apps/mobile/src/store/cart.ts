import type { CartItem, Product, SelectedModifier } from "@salora/types";
import { create } from "zustand";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, modifiers?: SelectedModifier[], unitPrice?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product, quantity = 1, modifiers = [], unitPrice = product.price) =>
    set((state) => {
      const key = `${product.id}:${modifiers.map((item) => `${item.groupId}=${item.optionId}`).sort().join("|")}`;
      const existing = state.items.find((item) => item.key === key);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + quantity } : item
          )
        };
      }
      return { items: [...state.items, { key, product, quantity, modifiers, unitPrice }] };
    }),
  removeItem: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key && item.product.id !== key) })),
  setQuantity: (key, quantity) =>
    set((state) => ({
      items: state.items
        .map((item) => (item.key === key || item.product.id === key ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0)
    })),
  clear: () => set({ items: [] })
}));
