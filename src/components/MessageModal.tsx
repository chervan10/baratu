"use client";

interface MessageModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export function MessageModal({ isOpen, title, message, buttonText = "OK", onClose }: MessageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200 text-center">
        {title && <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>}
        <p className="text-lg text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-green-800 text-white font-bold px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}