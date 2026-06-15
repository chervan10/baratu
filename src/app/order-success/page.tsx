"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, MapPin, Mail, Phone, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

interface OrderDetail {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  mpesaReference: string;
}

function OrderSuccessContent() {
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
        setError("Não foi possível carregar o resumo do seu pagamento.");
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A obter detalhes do pagamento...</p>
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
        <p className="text-gray-500 mb-8">{error || "Não encontrámos a sua transação."}</p>
        <Link href="/produtos" className="bg-green-800 text-white font-extrabold px-6 py-3 rounded-full hover:bg-green-700 transition">
          Voltar a Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      
      {/* Success Badge */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100 animate-bounce">
          <CheckCircle2 size={44} className="stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Pagamento Confirmado!</h1>
        <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
          O seu pagamento via <strong className="text-green-800 font-bold">{order.paymentMethod}</strong> foi processado com sucesso. A sua encomenda já está a ser preparada.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
        
        {/* Payment Confirmation Header */}
        <div className="border-b border-gray-100 pb-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Detalhes do Pagamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">Referência M-Pesa</span>
              <span className="font-mono text-green-900 font-black text-sm">{order.mpesaReference}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">Nº Encomenda</span>
              <span className="text-gray-800 font-black text-sm">{order.orderNumber}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">Valor Pago</span>
              <span className="text-green-800 font-black text-sm">{order.totalAmount.toFixed(0)} MT</span>
            </div>
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
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Morada de Entrega</h3>
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

        {/* Security / Confirmation message footer */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 border border-gray-100 text-xs text-gray-500">
          <ShieldCheck className="text-green-700 shrink-0" size={20} />
          <div>
            <p className="font-bold text-gray-700">Esta compra está protegida</p>
            <p>Enviámos uma confirmação de pagamento detalhada e fatura digital para o seu e-mail.</p>
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

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A carregar...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
