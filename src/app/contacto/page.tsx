"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { 
  Mail, 
  MapPin, 
  Send, 
  Phone, 
  User, 
  MessageSquare, 
  Tag, 
  RefreshCw, 
  AlertCircle
} from "lucide-react";

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
  const [submittingForm, setSubmittingForm] = useState(false);

  // Initialize React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
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

  // Final Contact Form Submission
  const onSubmit = async (data: ContactFormData) => {
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
      } else {
        const errorMsg = resData.details 
          ? `${resData.error || "Erro"}: ${resData.details}` 
          : (resData.error || "Erro ao enviar a sua mensagem.");
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na ligação ao servidor.");
    } finally {
      setSubmittingForm(false);
    }
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

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Mail size={16} className="text-gray-400" /> Endereço de E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  aria-required="true"
                  aria-invalid={errors.email ? "true" : "false"}
                  placeholder="seu.email@exemplo.com"
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.email 
                      ? "border-red-300 focus:ring-red-200" 
                      : "border-gray-200 focus:ring-green-200 focus:border-green-800"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p role="alert" className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email.message}
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
                className="w-full py-4 rounded-2xl font-black text-sm text-center shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] bg-green-800 hover:bg-green-700 text-white"
              >
                {submittingForm ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Enviar
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
