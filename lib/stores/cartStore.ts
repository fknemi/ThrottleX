import { create } from "zustand";

export const cartStore = create((set) => ({
  products: [],
  updateProducts: (newProducts: []) => set({ products: newProducts }),
}));
