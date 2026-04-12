import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  sku_id: string;
  product_name: string;
  variant_label: string;
  price_minor: number;
  quantity: number;
  image_url: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.sku_id === item.sku_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.sku_id === item.sku_id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (skuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.sku_id !== skuId),
        }));
      },

      updateQuantity: (skuId, quantity) => {
        const clamped = quantity < 1 ? 1 : quantity;
        set((state) => ({
          items: state.items.map((i) => (i.sku_id === skuId ? { ...i, quantity: clamped } : i)),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price_minor * item.quantity, 0);
      },
    }),
    {
      name: "storefront-cart",
      version: 1,
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("Failed to rehydrate cart:", error);
        }
      },
    }
  )
);
