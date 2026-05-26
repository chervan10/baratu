"use client";

import { useState } from "react";

interface LoadingModalProps {
  isOpen: boolean;
  message: string;
}

export function LoadingModal({ isOpen, message }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-200 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-800">{message}</p>
      </div>
    </div>
  );
}