import type { Metadata } from 'next';
import Link from 'next/link';
import KillTimeLogo from '@/components/KillTimeLogo'; // Adjust path if needed

export const metadata: Metadata = {
  title: 'KillTime Hub | Addictive Mini-Games',
  description: 'A collection of retro-inspired, fast-paced mini games.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f4f0] flex flex-col font-sans text-[#1e293b]">
      
      {/* The Animated Header */}
      <header className="pt-16 pb-8 flex items-center justify-center gap-2">
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight uppercase">Kill</h1>
        <KillTimeLogo />
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight uppercase">Time</h1>
      </header>

      <p className="text-xl text-gray-500 text-center mb-12 font-medium">
        A collection of uselessly fun things.
      </p>

      {/* Your Games Grid */}
      <div className="flex-grow flex items-center justify-center p-4">
        <Link href="/traffic-run" className="group block w-full max-w-sm h-64 rounded-xl border-[6px] border-[#334155] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] overflow-hidden relative">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: "url('/sprites/traffic-run/ss.png')", imageRendering: 'pixelated' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-3xl font-black text-white tracking-widest drop-shadow-md">TRAFFIC RUN</h2>
            <p className="text-blue-300 text-sm font-bold mt-1">DODGE THE HIGHWAY</p>
          </div>
        </Link>
      </div>

      <footer className="flex justify-between align-middle p-8 text-center border-t border-gray-300 mt-8 space-y-3">
        <p className="text-gray-500 text-sm font-medium">
          Built by{' '}
          <a href="https://maheshpaul.is-a.dev/" target="_blank" rel="noopener noreferrer" className=" hover:text-[#3b82f6] transition-colors">
            Mahesh Paul
          </a>
        </p>
        <p>
          <Link href="/credits" className="text-sm font-medium hover:text-[#3b82f6] hover:underline transition-colors">
            Credits
          </Link>
        </p>
      </footer>
    </main>
  );
}