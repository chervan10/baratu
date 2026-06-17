"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginUser, registerUser } from "@/app/actions/auth";
import { usePathname } from "next/navigation";
import { X, Mail, Lock, User, KeyRound, ShoppingBasket, Loader2, CheckCircle, XCircle, AtSign } from "lucide-react";

export function AuthModal() {
  const { showAuthModal, authView, openAuthModal, closeAuthModal } = useAuth();
  const pathname = usePathname();

  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!username) {
      setUsernameError("");
      setIsAvailable(null);
      return;
    }

    const trimmed = username.toLowerCase().trim();
    if (trimmed.length < 3) {
      setUsernameError("O nome de utilizador deve ter pelo menos 3 caracteres.");
      setIsAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
      setUsernameError("Apenas letras, números, sublinhados (_) e hífenes (-) são permitidos.");
      setIsAvailable(null);
      return;
    }

    setUsernameError("");
    setIsAvailable(null);
    setIsChecking(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setIsAvailable(true);
            setUsernameError("");
          } else {
            setIsAvailable(false);
            setUsernameError("Este nome de utilizador já está em uso.");
          }
        }
      } catch (err) {
        console.error("Erro ao verificar nome de utilizador:", err);
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [username]);

  const isFormInvalid = isChecking || isAvailable === false || !!usernameError || !username;

  if (!showAuthModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full cursor-pointer"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <span className="inline-flex rounded-full bg-green-100 text-green-800 px-4 py-1.5 text-xs font-black tracking-[0.25em] uppercase mb-3 shadow-sm">
            <ShoppingBasket size={14} className="mr-1.5" /> BARATU
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {authView === "login" ? "Entrar na tua conta" : "Criar uma nova conta"}
          </h2>
          <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
            {authView === "login"
              ? "Inicia sessão para gerires as tuas rotas locais e o teu carrinho de rancho."
              : "Regista-te grátis para começares a planear as tuas compras no mercado de Maputo."}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-6 border border-gray-100">
          <button
            onClick={() => openAuthModal("login")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              authView === "login"
                ? "bg-white text-green-950 shadow-sm font-black"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => openAuthModal("register")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              authView === "register"
                ? "bg-white text-green-950 shadow-sm font-black"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Registar
          </button>
        </div>

        {/* Login Form */}
        {authView === "login" ? (
          <form className="space-y-4" action={loginUser}>
            <input type="hidden" name="redirectTo" value={pathname} />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                E-mail ou Nome de utilizador
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="email"
                  type="text"
                  placeholder="exemplo@gmail.com ou joao_silva"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-green-800 hover:bg-green-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound size={16} /> Iniciar Sessão
            </button>
          </form>
        ) : (
          <form 
            className="space-y-4" 
            action={registerUser}
            onSubmit={(e) => {
              if (isFormInvalid) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="redirectTo" value={pathname} />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="name"
                  type="text"
                  placeholder="Teu nome completo"
                  autoComplete="name"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nome de utilizador (Username)
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="username"
                  type="text"
                  placeholder="ex: joao_silva"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
                <div className="absolute right-3.5 top-3.5 flex items-center">
                  {isChecking && <Loader2 className="animate-spin text-gray-400" size={16} />}
                  {!isChecking && isAvailable === true && <CheckCircle className="text-green-600" size={16} />}
                  {!isChecking && (isAvailable === false || !!usernameError) && username && <XCircle className="text-red-500" size={16} />}
                </div>
              </div>
              {username && (
                <div className="mt-1.5 text-[10px] font-bold">
                  {isChecking && <span className="text-gray-500">A verificar...</span>}
                  {!isChecking && isAvailable === true && <span className="text-green-600">Disponível!</span>}
                  {!isChecking && usernameError && <span className="text-red-500">{usernameError}</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="email"
                  type="email"
                  placeholder="exemplo@gmail.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  name="password"
                  type="password"
                  placeholder="Min. 6 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-800 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isFormInvalid}
              className={`w-full mt-2 py-3.5 font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                isFormInvalid
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-green-800 hover:bg-green-700 text-white"
              }`}
            >
              Criar Conta Grátis
            </button>
          </form>
        )}

        {/* Link view switch */}
        <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
          {authView === "login" ? (
            <>
              Não tens conta?{" "}
              <button
                onClick={() => openAuthModal("register")}
                className="font-bold text-green-800 hover:text-green-700 underline cursor-pointer"
              >
                Regista-te gratuitamente
              </button>
            </>
          ) : (
            <>
              Já tens conta?{" "}
              <button
                onClick={() => openAuthModal("login")}
                className="font-bold text-green-800 hover:text-green-700 underline cursor-pointer"
              >
                Inicia sessão aqui
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
