"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { Media } from "../../payload-types";

type CartItem = { productId: string; quantity: number; title?: string; image?: Media | string | null; price?: number | null };

type CartContextType = {
  items: CartItem[];
  cartCount: number; // total items (sum of quantities)
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => useContext(CartContext)!;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const computeCount = (arr: CartItem[]) => arr.reduce((s, it) => s + (it.quantity || 0), 0);

  // Fetch cart items from backend
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("fetchCart error:", err);
      setItems([]);
    }
  };

  // Add product to cart (quantity can be positive or negative delta)
  const addToCart = async (productId: string, quantity = 1) => {
    // optimistic update
    const prev = items;
    const existing = prev.find((it) => it.productId === productId);
    let optimistic: CartItem[];
    if (existing) {
      optimistic = prev.map((it) => (it.productId === productId ? { ...it, quantity: it.quantity + quantity } : it));
    } else {
      optimistic = [...prev, { productId, quantity }];
    }
    setItems(optimistic);

    try {
      const res = await fetch("/api/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && Array.isArray(data.items)) {
        setItems(data.items);
      } else if (!res.ok) {
        // revert to server copy on error
        await fetchCart();
      }
    } catch (err) {
      console.error("addToCart error:", err);
      // revert on network error
      await fetchCart();
    }
  };

  // Update quantity to a new absolute value. Uses the same add-to-cart route with delta when possible.
  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      const existing = items.find((it) => it.productId === productId);
      if (!existing) {
        // if setting to >0 and item not present, just add
        if (newQuantity > 0) {
          await addToCart(productId, newQuantity);
        }
        return;
      }

      if (newQuantity <= 0) {
        // remove
        await removeFromCart(productId);
        return;
      }

      const delta = newQuantity - existing.quantity;
      if (delta === 0) return;
      // Use same add-to-cart route for delta (can be positive or negative)
      await addToCart(productId, delta);
    } catch (err) {
      console.error("updateQuantity error:", err);
    }
  };

  const removeFromCart = async (productId: string) => {
    // optimistic remove locally
    const prev = items
    setItems(prev.filter((it) => it.productId !== productId))
    try {
      const res = await fetch("/api/remove-from-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) {
        // fallback to server state
        await fetchCart()
      } else {
        const data = await res.json().catch(() => null)
        if (data && Array.isArray(data.items)) setItems(data.items)
      }
    } catch (err) {
      console.error("removeFromCart error:", err)
      await fetchCart()
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const cartCount = computeCount(items);

  return (
    <CartContext.Provider
      value={{ items, cartCount, fetchCart, addToCart, updateQuantity, removeFromCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
