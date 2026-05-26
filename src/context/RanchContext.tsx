"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export interface RanchItem {
  id: number;
  nome: string;
  imagem: string;
  mercado: string;
  cidade: string;
  valor: number;
  categoria: string;
}

interface RanchContextType {
  cart: RanchItem[];
  addToRoute: (item: RanchItem) => void;
  removeFromRoute: (id: number, mercado: string) => void;
  clearRoute: () => void;
  setRoute: (items: RanchItem[]) => void;
}

const RanchContext = createContext<RanchContextType | undefined>(undefined);

export function RanchProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<RanchItem[]>([]);

  const addToRoute = (item: RanchItem) => {
    setCart((prev) => {
      // prevent exact duplicates
      if (prev.find((i) => i.id === item.id && i.mercado === item.mercado)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromRoute = (id: number, mercado: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.mercado === mercado)));
  };

  const clearRoute = () => {
    setCart([]);
  };

  const setRoute = (items: RanchItem[]) => {
    setCart(items);
  };

  return (
    <RanchContext.Provider value={{ cart, addToRoute, removeFromRoute, clearRoute, setRoute }}>
      {children}
    </RanchContext.Provider>
  );
}

export function useRanch() {
  const context = useContext(RanchContext);
  if (!context) {
    throw new Error("useRanch must be used within a RanchProvider");
  }
  return context;
}
