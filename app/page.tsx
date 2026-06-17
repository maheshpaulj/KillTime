import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'KillTime Hub | Addictive Mini-Games',
  description: 'A collection of retro-inspired, fast-paced mini games.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f4f0] flex flex-col font-sans text-gray-800">
      <header className="py-12 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">KillTime</h1>
      </header>

      <div className="flex-grow flex items-center justify-center p-10">
        <Link href="/traffic-run" className="group block w-64 h-48 rounded-2xl border-4 border-black shadow-lg overflow-hidden relative">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105"
            style={{ backgroundImage: "url('/sprites/traffic-run/ss.png')" }} 
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-white">Traffic Run</h2>
          </div>
        </Link>
      </div>

      <footer className="py-8 text-center border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          Built by <a href="https://maheshpaul.is-a.dev/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-600">Mahesh Paul</a>
        </p>
      </footer>
    </main>
  );
}