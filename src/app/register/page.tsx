"use client";

import Link from "next/link";
import { registerUser } from "@/app/actions/auth";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") || "";

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
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [username]);

  const isFormInvalid = isChecking || isAvailable === false || !!usernameError || !username;

  return (
    <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-green-100">
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100 text-center animate-in fade-in duration-200">
          {error}
        </div>
      )}
      <form 
        className="space-y-6" 
        action={registerUser}
        onSubmit={(e) => {
          if (isFormInvalid) {
            e.preventDefault();
          }
        }}
      >
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome completo
          </label>
          <div className="mt-1">
            <input
              name="name"
              type="text"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome de utilizador (Username)
          </label>
          <div className="mt-1 relative">
            <input
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm text-gray-900"
              placeholder="ex: joao_silva"
            />
            <div className="absolute right-3 top-3.5 flex items-center">
              {isChecking && <Loader2 className="animate-spin text-gray-400" size={18} />}
              {!isChecking && isAvailable === true && <CheckCircle className="text-green-600" size={18} />}
              {!isChecking && (isAvailable === false || !!usernameError) && username && <XCircle className="text-red-500" size={18} />}
            </div>
          </div>
          {username && (
            <div className="mt-1.5 text-xs font-semibold">
              {isChecking && <span className="text-gray-500">A verificar disponibilidade...</span>}
              {!isChecking && isAvailable === true && <span className="text-green-600">Disponível!</span>}
              {!isChecking && usernameError && <span className="text-red-500">{usernameError}</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <div className="mt-1">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <div className="mt-1">
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm text-gray-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isFormInvalid}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-colors cursor-pointer ${
              isFormInvalid 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-800"
            }`}
          >
            Registar
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-yellow-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-flex rounded-full bg-green-800 px-4 py-2 text-xs font-bold tracking-[0.35em] text-white uppercase shadow-lg">
          BARATU
        </span>
        <h2 className="mt-6 text-center text-4xl font-black text-green-900 tracking-tight">
          Cria a tua conta
        </h2>
        <p className="mt-3 text-center text-sm text-green-900 max-w-md mx-auto">
          Junta-te ao mercado BARATU e começa a fazer a tua lista de rancho do mês.
        </p>
        <p className="mt-2 text-center text-sm text-green-900">
          Já tens conta?{" "}
          <Link href="/login" className="font-semibold text-black hover:text-gray-800 underline">
            Entra aqui
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-center py-10">A carregar formulário...</div>}>
          <RegisterFormContent />
        </Suspense>
      </div>
    </div>
  );
}
