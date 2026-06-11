"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { 
  Mail, 
  MapPin, 
  Key, 
  CheckCircle2, 
  Send, 
  Phone, 
  User, 
  MessageSquare, 
  Tag, 
  RefreshCw, 
  X, 
  AlertCircle
} from "lucide-react";
import Link from "next/link";

// Form Validation Schema using Zod
const contactFormSchema = z.object({
  fullName: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  email: z.string().email("Endereço de e-mail inválido."),
  phone: z.string().optional().refine(
    (val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val),
    { message: "Número de telefone inválido. Insira um número válido (ex: 841234567)." }
  ),
  subject: z.string().min(3, "O assunto deve ter pelo menos 3 caracteres."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactoPage() {
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmailValue, setVerifiedEmailValue] = useState("");
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Initialize React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  // Countdown timer for OTP Resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Request OTP from Backend
  const handleRequestOtp = async () => {
    // Validate email field before sending OTP
    const isEmailValid = await trigger("email");
    if (!isEmailValid) {
      toast.error("Por favor, insira um e-mail válido antes de verificar.");
      return;
    }

    const email = getValues("email");
    setSendingOtp(true);
    
    try {
      const response = await fetch("/api/contact/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Código enviado com sucesso!");
        setIsVerifyingEmail(true);
        setResendCountdown(60);
        setOtpError("");
      } else {
        toast.error(data.error || "Erro ao solicitar código de verificação.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de ligação. Por favor, tente novamente.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP Code
  const handleConfirmOtp = async () => {
    const email = getValues("email");
    
    if (otpCodeInput.length !== 6 || !/^\d+$/.test(otpCodeInput)) {
      setOtpError("O código deve conter exatamente 6 algarismos numéricos.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    try {
      const response = await fetch("/api/contact/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCodeInput }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("E-mail verificado com sucesso!");
        setEmailVerified(true);
        setVerifiedEmailValue(email);
        setIsVerifyingEmail(false);
        setOtpCodeInput("");
      } else {
        setOtpError(data.error || "Código incorreto. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Erro na ligação ao servidor.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Final Contact Form Submission
  const onSubmit = async (data: ContactFormData) => {
    if (!emailVerified) {
      // If email has not been verified yet, trigger the OTP flow instead
      await handleRequestOtp();
      return;
    }

    // Safety check: Make sure email matches the verified one
    if (data.email.toLowerCase().trim() !== verifiedEmailValue.toLowerCase().trim()) {
      toast.error("O e-mail foi alterado. Por favor, verifique o novo e-mail.");
      setEmailVerified(false);
      setVerifiedEmailValue("");
      return;
    }

    setSubmittingForm(true);

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (response.ok) {
        toast.success(resData.message || "Mensagem enviada com sucesso!");
        reset();
        setEmailVerified(false);
        setVerifiedEmailValue("");
      } else {
        toast.error(resData.error || "Erro ao enviar a sua mensagem.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na ligação ao servidor.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleResetVerification = () => {
    setEmailVerified(false);
    setVerifiedEmailValue("");
    setValue("email", "");
  };

  return (
    <div className="w-full min-h-screen py-16 px-4 relative overflow-hidden bg-gradient-to-b from-yellow-50/30 to-stone-50">
      
      {/* Decorative background grid/elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-yellow-100 rounded-full blur-3xl opacity-30 -z-10" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-green-800 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-green-100/80 rounded-full">
            Contacte-nos
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 tracking-tight">
            Fale Connosco
          </h1>
          <p className="text-gray-600 text-lg mt-3">
            Dúvidas, sugestões ou feedbacks? Preencha o formulário abaixo. A nossa equipa responderá o mais breve possível.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Info cards (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-800 mb-6 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">E-mail de Suporte</h2>
              <p className="text-gray-500 text-sm mb-4">Envie-nos uma mensagem diretamente para questões gerais.</p>
              <a 
                href="mailto:geral@baratu.co.mz" 
                className="text-lg font-bold text-green-800 hover:text-green-700 transition-colors inline-flex items-center gap-1.5"
              >
                geral@baratu.co.mz
              </a>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="bg-yellow-50 w-12 h-12 rounded-2xl flex items-center justify-center text-yellow-600 mb-6 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Localização</h2>
              <p className="text-gray-500 text-sm mb-4">O nosso escritório de operações localiza-se na capital.</p>
              <p className="text-lg font-bold text-gray-800">Maputo, Moçambique</p>
            </div>

            <div className="bg-gradient-to-br from-green-800 to-green-950 text-white rounded-3xl p-8 shadow-sm border border-green-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-700 rounded-full blur-2xl opacity-40 -z-10" />
              <h3 className="text-lg font-bold mb-2">Painel Admin</h3>
              <p className="text-green-200 text-sm mb-6 leading-relaxed">
                É administrador do Baratu? Aceda ao painel para ver todas as submissões recebidas.
              </p>
              <Link 
                href="/admin/submissions" 
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-green-900 font-extrabold text-sm rounded-full shadow-sm hover:bg-green-50 transition-all active:scale-95"
              >
                Aceder ao Painel
              </Link>
            </div>

          </div>

          {/* Form container (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-md border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <User size={16} className="text-gray-400" /> Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  aria-required="true"
                  aria-invalid={errors.fullName ? "true" : "false"}
                  placeholder="Seu nome completo"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                  }`}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email & OTP Verification */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Mail size={16} className="text-gray-400" /> Endereço de E-mail <span className="text-red-500">*</span>
                </label>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      id="email"
                      type="email"
                      disabled={emailVerified}
                      aria-required="true"
                      aria-invalid={errors.email ? "true" : "false"}
                      placeholder="seu.email@exemplo.com"
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        emailVerified ? "border-green-200 bg-green-50/30 text-green-950 font-medium" : ""
                      } ${
                        errors.email 
                          ? "border-red-300 focus:ring-red-200" 
                          : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                      }`}
                      {...register("email")}
                    />
                    {emailVerified && (
                      <CheckCircle2 size={16} className="absolute right-3.5 top-3.5 text-green-600" />
                    )}
                  </div>
                  
                  {!emailVerified ? (
                    <button
                      type="button"
                      disabled={sendingOtp}
                      onClick={handleRequestOtp}
                      className="px-5 py-3 rounded-2xl bg-green-800 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {sendingOtp ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Enviando...
                        </>
                      ) : (
                        "Verificar E-mail"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetVerification}
                      className="px-5 py-3 rounded-2xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Alterar E-mail
                    </button>
                  )}
                </div>

                {errors.email && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
                {emailVerified && (
                  <p className="text-green-700 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={12} /> E-mail validado com sucesso! Pronto para submeter.
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Phone size={16} className="text-gray-400" /> Telefone <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="ex: 841234567"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.phone 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                  }`}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Tag size={16} className="text-gray-400" /> Assunto <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  aria-required="true"
                  aria-invalid={errors.subject ? "true" : "false"}
                  placeholder="Assunto da mensagem"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.subject 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                  }`}
                  {...register("subject")}
                />
                {errors.subject && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-gray-400" /> Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  aria-required="true"
                  aria-invalid={errors.message ? "true" : "false"}
                  placeholder="Escreva a sua mensagem detalhada aqui..."
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all resize-y min-h-[120px] ${
                    errors.message 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                  }`}
                  {...register("message")}
                />
                {errors.message && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.message.message}
                  </p>
                )}
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={submittingForm}
                className={`w-full py-4 rounded-2xl font-black text-sm text-center shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                  emailVerified 
                    ? "bg-green-800 hover:bg-green-700 text-white" 
                    : "bg-yellow-400 hover:bg-yellow-500 text-yellow-950"
                }`}
              >
                {submittingForm ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Enviando mensagem...
                  </>
                ) : !emailVerified ? (
                  <>
                    <Key size={16} /> Verificar E-mail & Enviar
                  </>
                ) : (
                  <>
                    <Send size={16} /> Enviar Mensagem
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>

      {/* OTP Verification Modal Overlay */}
      {isVerifyingEmail && (
        <div 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsVerifyingEmail(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-50 rounded-full cursor-pointer"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-100/80 text-yellow-800 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Key size={32} />
              </div>

              <h3 id="modal-title" className="text-2xl font-black text-gray-900 mb-2">
                Verifique o seu E-mail
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Enviámos um código de 6 algarismos para <strong className="text-gray-800 break-all">{getValues("email")}</strong>. Insira-o abaixo para continuar.
              </p>

              {/* OTP Code Input */}
              <div className="w-full mb-6">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-mono tracking-[0.75em] focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800"
                  aria-label="Código de verificação OTP de 6 dígitos"
                />
                
                {otpError && (
                  <p className="text-red-500 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> {otpError}
                  </p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="w-full space-y-3">
                <button
                  type="button"
                  disabled={verifyingOtp}
                  onClick={handleConfirmOtp}
                  className="w-full py-3.5 bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Verificando...
                    </>
                  ) : (
                    "Confirmar Código"
                  )}
                </button>

                <div className="flex items-center justify-between text-xs w-full pt-2">
                  <span className="text-gray-400">Não recebeu o código?</span>
                  
                  {resendCountdown > 0 ? (
                    <span className="text-gray-500 font-semibold">
                      Reenviar em {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-green-800 hover:text-green-700 font-extrabold cursor-pointer hover:underline"
                    >
                      Reenviar Código
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
