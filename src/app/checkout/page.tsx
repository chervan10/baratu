"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, CreditCard, ClipboardCheck, Lock, RefreshCw, CheckCircle2 } from "lucide-react";

// Form Validation Schema
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Nome completo é obrigatório (mínimo 2 caracteres)"),
  customerEmail: z.string().email("Endereço de e-mail inválido"),
  customerPhone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Número de telefone inválido (deve conter 7 a 15 algarismos)"),
  country: z.string().min(2, "País é obrigatório"),
  provinceState: z.string().optional(),
  city: z.string().min(2, "Cidade é obrigatória"),
  address: z.string().min(5, "Endereço completo é obrigatório (mínimo 5 caracteres)"),
  postalCode: z.string().min(3, "Código postal é obrigatório"),
  orderNotes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const { cart, subtotal, shippingCost, tax, discount, totalAmount, couponCode, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"billing" | "review">("billing");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      country: "Moçambique",
      city: "Maputo",
    },
  });

  // Prefill details if user is logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setValue("customerName", data.user.name);
          if (data.user.email) setValue("customerEmail", data.user.email);
        }
      })
      .catch(() => {});
  }, [setValue]);

  // Protect page if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !submitting) {
      toast.error("O seu carrinho está vazio.");
      router.push("/cart");
    }
  }, [cart, router, submitting]);

  const handleNextStep = () => {
    // If form is valid, trigger step change
    setStep("review");
  };

  const onFormSubmit = async (data: CheckoutFormValues) => {
    if (!termsAccepted) {
      toast.error("Por favor, confirme a encomenda assinalando a caixa de verificação.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        couponCode,
        cartItems: cart.map((item) => ({
          productId: item.productId,
          productName: item.nome,
          quantity: item.quantity,
          unitPrice: item.price,
          mercado: item.mercado,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("A iniciar pagamento M-Pesa...");
        clearCart();
        router.push(`/checkout/pay?orderNumber=${result.orderNumber}&checkoutRequestId=${result.checkoutRequestId}`);
      } else {
        toast.error(result.error || "Ocorreu um erro ao processar a encomenda.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede. Por favor, tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      
      {/* Navigation and Title */}
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={() => step === "review" ? setStep("billing") : router.push("/cart")}
          className="inline-flex items-center gap-2 text-green-800 font-bold hover:underline cursor-pointer"
        >
          <ArrowLeft size={16} /> {step === "review" ? "Voltar aos Dados de Envio" : "Voltar ao Carrinho"}
        </button>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Completa os teus dados de entrega para finalizares a compra.</p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center gap-4 mb-10 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-w-md">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
            step === "billing" ? "bg-green-800 text-white" : "bg-green-50 text-green-800 border border-green-200"
          }`}>1</span>
          <span className={`text-xs font-bold ${step === "billing" ? "text-gray-800" : "text-gray-400"}`}>Dados de Envio</span>
        </div>
        <div className="h-px bg-gray-200 flex-1" />
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
            step === "review" ? "bg-green-800 text-white" : "bg-gray-100 text-gray-400"
          }`}>2</span>
          <span className={`text-xs font-bold ${step === "review" ? "text-gray-800" : "text-gray-400"}`}>Revisão & Confirmação</span>
        </div>
      </div>

      {/* Form Submission logic wraps both steps */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-8 space-y-6">
          
          {step === "billing" ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-left-4 duration-300">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CreditCard className="text-green-800" size={20} /> Informações de Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
                  <input
                    type="text"
                    {...register("customerName")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.customerName ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: Chervan Cachaco"
                  />
                  {errors.customerName && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.customerName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Endereço de E-mail</label>
                  <input
                    type="email"
                    {...register("customerEmail")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.customerEmail ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: chervan@example.com"
                  />
                  {errors.customerEmail && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.customerEmail.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contacto Telefónico</label>
                  <input
                    type="text"
                    {...register("customerPhone")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.customerPhone ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: +258 84 123 4567"
                  />
                  {errors.customerPhone && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.customerPhone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">País</label>
                  <input
                    type="text"
                    {...register("country")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.country ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                  />
                  {errors.country && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.country.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Província / Estado</label>
                  <input
                    type="text"
                    {...register("provinceState")}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all"
                    placeholder="Ex: Cidade de Maputo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cidade</label>
                  <input
                    type="text"
                    {...register("city")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.city ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: Maputo"
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Endereço de Rua / Casa</label>
                  <input
                    type="text"
                    {...register("address")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.address ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: Av. Julius Nyerere, nº 123"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Código Postal</label>
                  <input
                    type="text"
                    {...register("postalCode")}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none transition-all ${
                      errors.postalCode ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-800"
                    }`}
                    placeholder="Ex: 1100"
                  />
                  {errors.postalCode && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.postalCode.message}</p>}
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas da Encomenda (Opcional)</label>
                <textarea
                  {...register("orderNotes")}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all text-gray-800 resize-none"
                  placeholder="Instruções para a entrega, código do portão, etc."
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit(handleNextStep)}
                  className="bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                >
                  Seguir para Revisão <ClipboardCheck size={16} />
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <ClipboardCheck className="text-green-800" size={20} /> Rever e Confirmar Encomenda
              </h2>

              {/* Display Customer Data Preview */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Nome Completo</span>
                  <span className="font-bold text-gray-800 text-sm">{getValues("customerName")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Contacto Telefónico</span>
                  <span className="font-bold text-gray-800 text-sm">{getValues("customerPhone")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">E-mail</span>
                  <span className="font-bold text-gray-800 text-sm">{getValues("customerEmail")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Morada de Entrega</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {getValues("address")}, {getValues("city")}, {getValues("provinceState") ? getValues("provinceState") + ", " : ""}{getValues("country")} ({getValues("postalCode")})
                  </span>
                </div>
                {getValues("orderNotes") && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Notas</span>
                    <span className="font-medium text-gray-700 block italic mt-1">"{getValues("orderNotes")}"</span>
                  </div>
                )}
              </div>

              {/* Items List Review */}
              <div>
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Artigos Encomendados</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-right">Unitário</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {item.nome}
                            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">Mercado: {item.mercado}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono">{item.price} MT</td>
                          <td className="px-4 py-3 text-right font-bold font-mono">{item.price * item.quantity} MT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mandatory Confirmation terms */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-green-800 focus:ring-green-800 border-gray-300"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed font-semibold">
                    Confirmo que os dados da encomenda estão corretos, aceito as condições e assumo a responsabilidade por esta compra.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStep("billing")}
                  className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Modificar Dados
                </button>

                <button
                  type="submit"
                  disabled={submitting || !termsAccepted}
                  className={`py-3.5 px-8 font-extrabold text-sm rounded-full shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    !termsAccepted 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                      : "bg-green-800 hover:bg-green-700 text-white hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} /> Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Finalizar Encomenda
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Pricing Recalculations summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-28">
            <h3 className="font-extrabold text-lg text-gray-800 mb-6">Resumo de Custos</h3>
            
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

            <div className="py-6 flex justify-between items-baseline mb-4">
              <span className="text-base font-bold text-gray-800">Custo Total</span>
              <span className="text-3xl font-black text-green-800">{totalAmount.toFixed(0)} MT</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 font-semibold justify-center">
              <Lock size={12} className="text-green-800 shrink-0" /> Checkout Seguro de Dados
            </div>

          </div>
        </div>

      </form>

    </div>
  );
}
