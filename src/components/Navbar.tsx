"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBasket, Navigation, Menu, X, UserCircle, Truck } from "lucide-react";
import { CartBadge } from "@/app/CartBadge";
import { CartBadge as EcomCartBadge } from "@/components/CartBadge";

interface NavbarProps {
  user: { id: string; email: string; name: string | null } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firstName = user?.name?.split(' ')[0] || null;

  return (
    <header className="bg-green-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">
        <div className="md:hidden flex items-center z-50">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-white p-2 hover:bg-green-700 rounded-full transition"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <Link href="/" className="hidden md:flex items-center gap-2 text-2xl font-black italic tracking-tighter uppercase relative z-50" onClick={() => setIsOpen(false)}>
          <ShoppingBasket size={28} /> BARATU
        </Link>

        <Link href="/" className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-xl font-black uppercase text-white" onClick={() => setIsOpen(false)}>
          <ShoppingBasket size={22} /> BARATU
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-semibold text-sm">
          <Link href="/" className="hover:text-yellow-300 transition">Início</Link>
          <Link href="/produtos" className="hover:text-yellow-300 transition">Produtos</Link>
          <Link href="/sobre" className="hover:text-yellow-300 transition">Sobre Nós</Link>
          <Link href="/contacto" className="hover:text-yellow-300 transition">Contacto</Link>
          
          <Link href="/rota" className="bg-yellow-400 hover:bg-yellow-500 text-green-900 px-4 py-2 rounded-full flex items-center gap-2 transition ml-4">
            <Navigation size={16} /> 
            Minha Rota
            <CartBadge />
          </Link>

          <Link href="/cart" className="bg-green-700 hover:bg-green-650 text-white px-4 py-2 rounded-full flex items-center gap-2 transition border border-green-600">
            <Truck size={16} />
            Delivery
            <EcomCartBadge />
          </Link>

          <Link href="/perfil" className="hover:text-yellow-300 transition flex items-center gap-1">
            <UserCircle size={20} />
            {firstName ? firstName : "Perfil"}
          </Link>
        </nav>

        <div className="md:hidden flex items-center gap-4 z-50">
          <Link href="/rota" className="flex items-center relative" onClick={() => setIsOpen(false)}>
            <div className="bg-yellow-400 hover:bg-yellow-500 text-green-900 p-2 rounded-full transition animate-in zoom-in duration-200">
              <Navigation size={20} />
            </div>
            <div className="absolute -top-1 -right-2">
              <CartBadge />
            </div>
          </Link>

          <Link href="/cart" className="flex items-center relative" onClick={() => setIsOpen(false)}>
            <div className="bg-green-700 text-white p-2 rounded-full transition border border-green-600">
              <Truck size={20} />
            </div>
            <div className="absolute -top-1 -right-2">
              <EcomCartBadge />
            </div>
          </Link>

          <Link href="/perfil" className="flex items-center text-white hover:text-yellow-300 transition" onClick={() => setIsOpen(false)}>
            <UserCircle size={24} />
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-green-800 border-t border-green-700 shadow-xl md:hidden overflow-hidden origin-top animate-in slide-in-from-top-4 fade-in duration-200">
          <nav className="flex flex-col text-center px-4 pt-4 pb-8 gap-4 font-bold text-lg">
            <Link href="/" className="p-4 bg-green-700/50 rounded-2xl active:bg-green-700" onClick={() => setIsOpen(false)}>
              Início
            </Link>
            <Link href="/produtos" className="p-4 bg-green-700/50 rounded-2xl active:bg-green-700" onClick={() => setIsOpen(false)}>
              Produtos
            </Link>
            <Link href="/sobre" className="p-4 bg-green-700/50 rounded-2xl active:bg-green-700" onClick={() => setIsOpen(false)}>
              Sobre Nós
            </Link>
            <Link href="/contacto" className="p-4 bg-green-700/50 rounded-2xl active:bg-green-700" onClick={() => setIsOpen(false)}>
              Contacto
            </Link>
            <Link href="/perfil" className="p-4 bg-green-700/50 rounded-2xl active:bg-green-700 flex items-center justify-center gap-2" onClick={() => setIsOpen(false)}>
              <UserCircle size={20} />
              {firstName ? firstName : "Perfil"}
            </Link>
            <Link href="/rota" className="p-4 bg-yellow-400 text-green-900 rounded-2xl mt-2 flex items-center justify-center gap-2" onClick={() => setIsOpen(false)}>
              <Navigation size={20} /> 
              Ver Minha Rota
            </Link>
            <Link href="/cart" className="p-4 bg-green-950 text-white rounded-2xl mt-2 flex items-center justify-center gap-2" onClick={() => setIsOpen(false)}>
              <Truck size={20} /> 
              Ver Delivery
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
