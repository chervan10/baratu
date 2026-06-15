"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, Smartphone, ShieldCheck, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

function CheckoutPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("orderNumber");
  const checkoutRequestId = searchParams.get("checkoutRequestId");

  const [dots, setDots] = useState("");
  const [timer, setTimer] = useState(60); // 60s timeout for checking
  const [checking, setChecking] = useState(true);

  // Animate loading text dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll verification endpoint
  useEffect(() => {
    if (!checkoutRequestId || !orderNumber) return;

    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    const performCheck = async () => {
      try {
        const res = await fetch(`/api/payment/verify?checkoutRequestId=${checkoutRequestId}`);
        if (!res.ok) throw new Error("Status query error");
        
        const data = await res.json();
        
        if (data.paymentStatus === "Successful") {
          toast.success("Pagamento confirmado!");
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          router.push(`/order-success?orderNumber=${orderNumber}`);
        } else if (data.paymentStatus === "Failed") {
          toast.error("O pagamento falhou.");
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          router.push(`/payment-failed?orderNumber=${orderNumber}&error=M-Pesa transaction failed`);
        }
      } catch (err) {
        console.error("Error verifying payment status:", err);
      }
    };

    // Run first check immediately
    performCheck();

    // Set up polling every 3 seconds
    pollInterval = setInterval(performCheck, 3000);

    // Set up timeout timer
    timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setChecking(false);
          toast.error("Tempo limite de verificação excedido.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [checkoutRequestId, orderNumber, router]);

  if (!orderNumber || !checkoutRequestId) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Transação Inválida</h1>
        <p className="text-gray-500 mb-4">Faltam parâmetros obrigatórios de checkout.</p>
        <button onClick={() => router.push("/checkout")} className="bg-green-800 text-white px-6 py-2.5 rounded-full text-xs font-bold">
          Voltar ao Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16 animate-in fade-in duration-300">
      
      {/* Pay container */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 text-center space-y-6">
        
        {/* Status circle */}
        <div className="w-20 h-20 bg-green-50 text-green-800 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-sm relative">
          <Smartphone size={36} className="animate-pulse" />
          <Loader2 size={20} className="animate-spin absolute right-0 bottom-0 text-green-700 bg-white rounded-full p-0.5 border" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Autorizar Pagamento</h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Encomenda: <span className="font-mono text-gray-800">{orderNumber}</span>
          </p>
        </div>

        {/* Action steps */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-left text-xs text-gray-700 space-y-3 font-medium">
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-green-800 text-white flex items-center justify-center shrink-0 font-bold">1</span>
            <p className="mt-0.5">Enviámos uma notificação (STK Push) para o seu telemóvel registado.</p>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-green-800 text-white flex items-center justify-center shrink-0 font-bold">2</span>
            <p className="mt-0.5">Introduza o seu **PIN do M-Pesa** no ecrã do telemóvel para autorizar o débito.</p>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-green-800 text-white flex items-center justify-center shrink-0 font-bold">3</span>
            <p className="mt-0.5">Aguarde nesta página enquanto validamos a confirmação.</p>
          </div>
        </div>

        {/* Verification Loader */}
        <div className="py-2">
          {checking ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-800">
                A verificar estado do pagamento{dots}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Tempo restante: {timer} segundos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold text-red-500">
                Não detetámos o pagamento.
              </p>
              <button
                onClick={() => router.push(`/payment-failed?orderNumber=${orderNumber}&error=Tempo limite atingido.`)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition cursor-pointer uppercase tracking-wider"
              >
                Prosseguir como Falhado
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-gray-100 flex justify-center items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
          <ShieldCheck size={14} className="text-green-700" /> Transação de pagamento encriptada
        </div>

      </div>

      {/* Manual verification button */}
      <div className="mt-6 text-center">
        <button
          onClick={async () => {
            const toastId = toast.loading("A verificar novamente...");
            try {
              const res = await fetch(`/api/payment/verify?checkoutRequestId=${checkoutRequestId}`);
              const data = await res.json();
              if (data.paymentStatus === "Successful") {
                toast.success("Confirmado com sucesso!", { id: toastId });
                router.push(`/order-success?orderNumber=${orderNumber}`);
              } else {
                toast.error("O pagamento ainda está pendente ou falhou.", { id: toastId });
              }
            } catch (err) {
              toast.error("Erro ao verificar.", { id: toastId });
            }
          }}
          className="text-xs text-green-800 hover:underline font-extrabold cursor-pointer flex items-center gap-1 mx-auto"
        >
          <HelpCircle size={14} /> Já efetuei o PIN, verificar manualmente
        </button>
      </div>

    </div>
  );
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">A carregar...</p>
      </div>
    }>
      <CheckoutPayContent />
    </Suspense>
  );
}
