"use client";

import { useRanch, RanchItem } from "@/context/RanchContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingModal } from "@/components/LoadingModal";

export default function LoadRouteButton({ savedItems }: { savedItems: RanchItem[] }) {
  const { setRoute } = useRanch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    setIsLoading(true);
    // Wait 3-5 seconds
    const delay = Math.random() * 2000 + 3000; // 3-5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    setRoute(savedItems);
    setIsLoading(false);
    router.push("/rota");
  };

  if (savedItems.length === 0) return null;

  return (
    <>
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-6 rounded-xl transition-colors shadow-md disabled:opacity-50"
      >
        Carregar Lista Guardada
      </button>
      <LoadingModal isOpen={isLoading} message="A carregar lista guardada" />
    </>
  );
}
