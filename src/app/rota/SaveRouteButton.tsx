"use client";

import { useRanch } from "@/context/RanchContext";
import { saveUserRoute } from "@/app/actions/routeActions";
import { useState } from "react";
import { Save } from "lucide-react";

export default function SaveRouteButton() {
  const { cart } = useRanch();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const result = await saveUserRoute(cart);
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      // You could handle the error state here, e.g. alert(result.error)
      // Usually if user is not authenticated, they should be redirected,
      // but for simplicity we assume the button is shown or the error is silent
      alert(result.error || "Ocorreu um erro ao guardar.");
    }
  };

  if (cart.length === 0) return null;

  return (
    <button
      onClick={handleSave}
      disabled={loading || success}
      className={`font-bold px-6 py-3 rounded-full transition shadow-md flex items-center justify-center gap-2 text-sm w-full sm:w-auto ${
        success 
          ? "bg-green-100 text-green-800 border border-green-200" 
          : "bg-white text-green-800 border border-green-800 hover:bg-green-50"
      }`}
    >
      <Save size={18} />
      {loading ? "A guardar..." : success ? "Guardado!" : "Guardar Lista no Perfil"}
    </button>
  );
}
