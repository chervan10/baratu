"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Check, ShoppingBag, MapPin, Mail, Phone, Calendar, ArrowRight } from "lucide-react";

interface OrderDetail {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setError("Número de encomenda em falta.");
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/status?orderNumber=${orderNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar dados.");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Não foi possível carregar o resumo da sua encomenda.");
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A carregar resumo da encomenda...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-black">!</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Ops! Ocorreu um problema</h1>
        <p className="text-gray-500 mb-8">{error || "Não encontrámos a sua encomenda."}</p>
        <Link href="/produtos" className="bg-green-800 text-white font-extrabold px-6 py-3 rounded-full hover:bg-green-700 transition">
          Voltar a Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      
      {/* Success Badge */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-50 text-green-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 animate-bounce">
          <Check size={40} className="stroke-[3]" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Obrigado pela sua compra!</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          A sua encomenda foi recebida com sucesso. Enviámos um e-mail de confirmação para <strong className="text-gray-700">{order.customerEmail}</strong>.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-8">
        
        {/* Order Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100 pb-6 text-xs text-gray-500">
          <div>
            <span className="font-bold block uppercase tracking-wider mb-1">Nº Encomenda</span>
            <span className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</span>
          </div>
          <div>
            <span className="font-bold block uppercase tracking-wider mb-1">Data</span>
            <span className="font-bold text-gray-900 text-sm">{new Date().toLocaleDateString("pt-MZ")}</span>
          </div>
          <div>
            <span className="font-bold block uppercase tracking-wider mb-1">Total Cobrado</span>
            <span className="font-bold text-green-800 text-sm">{order.totalAmount.toFixed(0)} MT</span>
          </div>
          <div>
            <span className="font-bold block uppercase tracking-wider mb-1">Método de Envio</span>
            <span className="font-bold text-gray-900 text-sm">Entrega Standard</span>
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Dados do Cliente</h3>
            <div className="space-y-2 text-sm text-gray-700 font-medium">
              <p className="font-extrabold text-gray-800">{order.customerName}</p>
              <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {order.customerEmail}</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {order.customerPhone}</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Morada de Envio</h3>
            <div className="flex items-start gap-2 text-sm text-gray-700 font-medium">
              <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-gray-800">{order.address}</p>
                <p>{order.city}, {order.postalCode}</p>
                <p className="uppercase text-xs text-gray-400 font-bold">{order.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div>
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Resumo dos Artigos</h3>
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Quantidade</th>
                  <th className="px-4 py-3 text-right">Unitário</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.productName}</td>
                    <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{item.unitPrice} MT</td>
                    <td className="px-4 py-3 text-right font-bold font-mono">{item.totalPrice} MT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations */}
        <div className="pt-6 border-t border-gray-100 flex flex-col items-end text-sm">
          <div className="w-full sm:w-64 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Subtotal</span>
              <span className="font-bold text-gray-800">{order.subtotal.toFixed(0)} MT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Envio</span>
              <span className="font-bold text-gray-800">{order.shippingCost.toFixed(0)} MT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">IVA (17%)</span>
              <span className="font-bold text-gray-800">{order.tax.toFixed(0)} MT</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700 font-bold">
                <span>Desconto</span>
                <span>-{order.discount.toFixed(0)} MT</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="font-black text-gray-800">Custo Final:</span>
              <span className="text-2xl font-black text-green-800">{order.totalAmount.toFixed(0)} MT</span>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-10 text-center">
        <Link 
          href="/produtos" 
          className="inline-flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white font-extrabold px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg uppercase text-xs tracking-wider"
        >
          Continuar a Comprar <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A carregar...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
