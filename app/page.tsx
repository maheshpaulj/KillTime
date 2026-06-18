import type { Metadata } from 'next';
import Link from 'next/link';
import KillTimeLogo from '@/components/KillTimeLogo'; // Adjust path if needed

export const metadata: Metadata = {
  title: 'KillTime',
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
      <div className="flex-grow flex items-center justify-center p-4 gap-8">
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
        <Link href="/spend" className="group block w-full max-w-sm h-64 rounded-xl border-[6px] border-[#334155] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] overflow-hidden relative bg-[#1e293b]">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: "url('/sprites/spend/spend.png')", imageRendering: 'pixelated' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-3xl font-black text-white tracking-widest drop-shadow-md">Spend Elon Musk's Fortune</h2>
            <p className="text-green-400 text-sm font-bold mt-1">BLOW $1 TRILLION</p>
          </div>
        </Link>
      </div>
    </main>
  );
}