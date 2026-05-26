import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params?.error;
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
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-green-100">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100 text-center">
              {error}
            </div>
          )}
          <form className="space-y-6" action={registerUser}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <div className="mt-1">
                <input
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                />
              </div>
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
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
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
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-800 focus:border-green-800 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-800 transition-colors"
              >
                Registar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
