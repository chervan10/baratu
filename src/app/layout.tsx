import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RanchProvider } from "@/context/RanchContext";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { getUser } from "@/lib/auth";
import { VisitorTracker } from "@/components/VisitorTracker";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baratu | Preços de Maputo",
  description: "Encontra os Melhores Preços do Dia em Maputo",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  return (
    <html lang="pt" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-yellow-50/50 min-h-screen flex flex-col text-gray-900">
        <RanchProvider>
          <Navbar user={user} />
          
          <main className="flex-1 w-full flex flex-col items-center">
            {children}
          </main>
          
          <footer className="bg-stone-900 text-stone-400 py-8 text-center text-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
              <p className="font-bold text-white text-lg">BARATU</p>
              <p>© {new Date().getFullYear()} Baratu Moz. Todos os direitos reservados.</p>
              <p>Preços sujeitos a variação nos mercados de Maputo.</p>
            </div>
          </footer>
        </RanchProvider>
        <Toaster />
        <VisitorTracker />
      </body>
    </html>
  );
}
