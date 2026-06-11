"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, Mail, RefreshCw, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple empty fields validation
    if (!email || !password) {
      setErrorMsg("E-mail e senha são campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login efetuado com sucesso!");
        router.push(redirectPath);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Credenciais de administrador incorretas.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Falha na ligação. Verifique a sua ligação à internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-900 to-green-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 -z-10" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-10 -z-10" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-green-500 rounded-full blur-3xl opacity-10 -z-10" />

      {/* Back to Home link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm transition-all"
        >
          <ArrowLeft size={16} />
          Voltar ao Início
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-flex rounded-full bg-green-800 border border-green-700 px-4 py-2 text-xs font-bold tracking-[0.35em] text-yellow-300 uppercase shadow-lg mb-4">
          Administração
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          Painel de Controlo
        </h2>
        <p className="mt-3 text-sm text-green-100/80 max-w-sm mx-auto">
          Apenas contas de administração autorizadas podem autenticar-se e aceder aos dados deste painel.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-green-100/10">
          
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-shake">
              <ShieldAlert size={18} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                E-mail de Administrador
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-800 transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  "Autenticar Acesso"
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
