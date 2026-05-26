"use client";

import { FormEvent, useState } from "react";
import { logoutUser } from "@/app/actions/auth";

export function LogoutConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!isOpen) {
      event.preventDefault();
      return;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openModal}
        className="text-sm font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
      >
        Sair da Conta
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Tem certeza?</h2>
            <p className="text-gray-600 mb-6">
              Esta ação irá encerrar sua sessão. Deseja continuar?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <form action={logoutUser} className="w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-3 rounded-2xl transition-colors"
                >
                  Sim, sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
