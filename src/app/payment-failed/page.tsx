"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { XCircle, AlertTriangle, ArrowLeft, RefreshCw, ShoppingBag } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorMessage = searchParams.get("error") || "Ocorreu um erro no processamento do seu pagamento via M-Pesa.";
  const orderNumber = searchParams.get("orderNumber");

  const handleRetry = () => {
    if (orderNumber) {
      router.push(`/checkout/pay?orderNumber=${orderNumber}`);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
      
      {/* Error Badge */}
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
        <XCircle size={44} className="stroke-[2.5]" />
      </div>

      <h1 className="text-3xl font-black text-gray-900 mb-3">Falha no Pagamento</h1>
      <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-8">
        Não conseguimos concluir o débito da transação M-Pesa. Certifique-se de que inseriu o PIN correto no telemóvel e tem saldo suficiente.
      </p>

      {/* Error Card */}
      <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 text-left mb-8 flex gap-3 text-xs leading-relaxed text-red-800 font-semibold max-w-md mx-auto">
        <AlertTriangle className="shrink-0 text-red-600" size={18} />
        <div>
          <span className="block text-[10px] text-red-500 uppercase tracking-wider mb-0.5">Detalhe do Erro</span>
          <p>{errorMessage}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <button
          onClick={handleRetry}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 text-white font-extrabold px-6 py-3.5 rounded-full transition shadow-md hover:shadow-lg uppercase text-xs tracking-wider cursor-pointer"
        >
          <RefreshCw size={14} /> Tentar Novamente
        </button>
        
        <Link
          href="/cart"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold px-6 py-3.5 rounded-full transition uppercase text-xs tracking-wider"
        >
          <ArrowLeft size={14} /> Voltar ao Carrinho
        </Link>
      </div>

      <p className="text-[10px] text-gray-400 mt-8">
        Se o valor foi retirado da sua conta, por favor contacte a nossa equipa de suporte através do e-mail de contactos.
      </p>

    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A carregar...</p>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
