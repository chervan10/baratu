import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:bottom-auto md:border-b md:border-t-0 z-50">
      <div className="max-w-md mx-auto flex justify-around py-3">
        <Link href="/" className="flex flex-col items-center text-green-700">
          <span className="text-xl">🏠</span>
          <span className="text-xs font-bold">Início</span>
        </Link>
        <Link href="/precos" className="flex flex-col items-center text-gray-500 hover:text-green-700">
          <span className="text-xl">💰</span>
          <span className="text-xs font-bold">Preços</span>
        </Link>
        <Link href="/sobre" className="flex flex-col items-center text-gray-500 hover:text-green-700">
          <span className="text-xl">ℹ️</span>
          <span className="text-xs font-bold">Sobre</span>
        </Link>
      </div>
    </nav>
  );
}