"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

export interface CartItem {
  id: string; // unique identifier: `${productId}-${mercado}`
  productId: number;
  nome: string;
  imagem: string;
  mercado: string;
  cidade: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: { id: number; nome: string; imagem: string }, quantity: number, priceObj: { mercado: string; cidade: string; valor: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  couponCode: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_FLAT_RATE = 150; // Flat shipping rate in MT
const TAX_IVA_RATE = 0.17; // 17% IVA in Mozambique
const VALID_COUPONS: Record<string, number> = {
  "BARATU10": 0.10, // 10% discount coupon
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    let stored: string | null = null;
    let storedCoupon: string | null = null;
    try {
      stored = localStorage.getItem("baratu_ecommerce_cart");
      storedCoupon = localStorage.getItem("baratu_ecommerce_coupon");
    } catch (err) {
      console.error("Error loading cart from localStorage:", err);
    }
    
    // Defer state updates to avoid synchronous setState in effect body
    setTimeout(() => {
      if (stored) {
        try {
          setCart(JSON.parse(stored));
        } catch (e) {
          console.error("Failed parsing cart JSON:", e);
        }
      }
      if (storedCoupon) {
        setCouponCode(storedCoupon);
      }
      setIsLoaded(true);
    }, 0);
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("baratu_ecommerce_cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, [cart, isLoaded]);

  // Save coupon to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (couponCode) {
        localStorage.setItem("baratu_ecommerce_coupon", couponCode);
      } else {
        localStorage.removeItem("baratu_ecommerce_coupon");
      }
    } catch (err) {
      console.error("Error saving coupon to localStorage:", err);
    }
  }, [couponCode, isLoaded]);

  const addToCart = (
    product: { id: number; nome: string; imagem: string },
    quantity: number,
    priceObj: { mercado: string; cidade: string; valor: number }
  ) => {
    const itemId = `${product.id}-${priceObj.mercado}`;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        toast.success(`Adicionado mais ${quantity}x de "${product.nome}" ao carrinho.`);
        return updated;
      }

      toast.success(`"${product.nome}" adicionado ao carrinho.`);
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          nome: product.nome,
          imagem: product.imagem,
          mercado: priceObj.mercado,
          cidade: priceObj.cidade,
          price: priceObj.valor,
          quantity: quantity,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item) {
        toast.success(`"${item.nome}" removido do carrinho.`);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
  };

  const applyCoupon = (code: string): boolean => {
    const upperCode = code.trim().toUpperCase();
    if (VALID_COUPONS[upperCode] !== undefined) {
      setCouponCode(upperCode);
      toast.success(`Cupão ${upperCode} aplicado com sucesso!`);
      return true;
    }
    toast.error("Cupão de desconto inválido.");
    return false;
  };

  const removeCoupon = () => {
    setCouponCode(null);
    toast.success("Cupão removido.");
  };

  // Math calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = subtotal > 0 ? SHIPPING_FLAT_RATE : 0;
  const tax = subtotal * TAX_IVA_RATE;
  
  const discountRate = couponCode ? (VALID_COUPONS[couponCode] || 0) : 0;
  const discount = subtotal * discountRate;
  
  const totalAmount = Math.max(0, subtotal + shippingCost + tax - discount);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        couponCode,
        applyCoupon,
        removeCoupon,
        subtotal,
        shippingCost,
        tax,
        discount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
