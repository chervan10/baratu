"use client";
import { useRanch } from "@/context/RanchContext";

export function CartBadge() {
  const { cart } = useRanch();
  
  if (cart.length === 0) return null;
  
  return (
    <span className="bg-white text-green-800 text-xs font-black rounded-full h-5 w-5 flex items-center justify-center">
      {cart.length}
    </span>
  );
}
