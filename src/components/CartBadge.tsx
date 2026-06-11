"use client";

import { useCart } from "@/context/CartContext";

export function CartBadge() {
  const { cart } = useCart();
  
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  if (totalQty === 0) return null;
  
  return (
    <span className="bg-white text-green-800 text-xs font-black rounded-full h-5 w-5 flex items-center justify-center animate-in scale-in duration-200">
      {totalQty}
    </span>
  );
}
