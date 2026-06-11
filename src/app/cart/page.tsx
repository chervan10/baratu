"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Percent, ShoppingCart } from "lucide-react";

export default function CartPage() {
  const {
    cart,
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
  } = useCart();

  const [couponInput, setCouponInput] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput);
    if (success) setCouponInput("");
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-green-50 text-green-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
          <ShoppingCart size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">O teu carrinho está vazio</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Ainda não adicionaste nenhum produto para compra online. Espreita os produtos disponíveis nos mercados de Maputo.
        </p>
        <Link 
          href="/produtos" 
          className="bg-green-800 hover:bg-green-950 text-white font-extrabold px-8 py-3.5 rounded-full shadow-md transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 text-sm uppercase tracking-wider"
        >
          <ShoppingBag size={18} /> Explorar Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
          Carrinho de Compras <ShoppingBag className="text-green-800" />
        </h1>
        <p className="text-gray-600">Revisores de encomendas e cálculo de taxas e despesas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart items list table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Itens no Carrinho ({totalItems})</h2>
              <button 
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-extrabold transition-all cursor-pointer underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Limpar Tudo
              </button>
            </div>

            <div className="space-y-6 divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="pt-6 first:pt-0 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                  
                  {/* Left Side: Product Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 relative overflow-hidden border border-gray-100 shrink-0">
                      <Image src={item.imagem} alt={item.nome} fill className="object-cover" />
                    </div>
                    <div>
                      <Link href={`/produtos/${item.productId}`} className="font-extrabold text-gray-800 hover:text-green-800 transition-colors text-base block">
                        {item.nome}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full font-bold border border-green-100 uppercase tracking-wider text-[10px]">
                          {item.mercado}
                        </span>
                        <span className="text-gray-400 font-semibold uppercase text-[9px]">{item.cidade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quantity selector, pricing, and actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10">
                    
                    {/* Quantity selectors */}
                    <div className="flex items-center border border-gray-200 rounded-full px-2.5 py-1.5 bg-gray-50/50">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-gray-500 hover:text-green-800 p-1 transition-colors cursor-pointer"
                        title="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-green-800 p-1 transition-colors cursor-pointer"
                        title="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price and Subtotal */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-gray-400 font-semibold uppercase">{item.price} MT / un</p>
                      <p className="text-base font-black text-gray-800">{item.price * item.quantity} MT</p>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                      title="Remover produto"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side summary panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-base text-gray-800 mb-4 flex items-center gap-2">
              <Percent size={18} className="text-green-800" /> Cupão de Desconto
            </h3>
            
            {couponCode ? (
              <div className="bg-green-50/50 border border-green-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-green-700 font-bold block uppercase tracking-wider">Cupão Ativo</span>
                  <span className="font-mono text-sm font-black text-green-900">{couponCode} (10% OFF)</span>
                </div>
                <button 
                  onClick={removeCoupon}
                  className="text-xs text-red-500 font-extrabold hover:underline cursor-pointer"
                >
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Ex: BARATU10"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all text-gray-800 uppercase font-mono font-bold"
                />
                <button 
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}
            <p className="text-[10px] text-gray-400 mt-2">Usa o cupão de boas-vindas <strong>BARATU10</strong> para testares o desconto.</p>
          </div>

          {/* Checkout summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-lg text-gray-800 mb-6">Resumo da Encomenda</h3>
            
            <div className="space-y-4 text-sm border-b border-gray-100 pb-6">
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-800">{subtotal.toFixed(0)} MT</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Transporte (Envio)</span>
                <span className="font-semibold text-gray-800">{shippingCost.toFixed(0)} MT</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">IVA (17%)</span>
                <span className="font-semibold text-gray-800">{tax.toFixed(0)} MT</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 text-xs font-bold">
                  <span>Desconto ({couponCode})</span>
                  <span>-{discount.toFixed(0)} MT</span>
                </div>
              )}

            </div>

            <div className="py-6 flex justify-between items-baseline mb-6">
              <span className="text-base font-bold text-gray-800">Custo Total</span>
              <span className="text-3xl font-black text-green-800">{totalAmount.toFixed(0)} MT</span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 tracking-wider uppercase text-center"
            >
              Seguir para o Checkout <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}
