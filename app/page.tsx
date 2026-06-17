'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

const games = [
  { id: 'traffic-run', title: 'Traffic Run', color: 'bg-blue-500' },
  { id: 'coming-soon-1', title: '???', color: 'bg-gray-300' },
  { id: 'coming-soon-2', title: '???', color: 'bg-gray-300' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f4f0] p-10 font-sans text-gray-800">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">KillTime</h1>
        <p className="text-xl text-gray-500">A collection of uselessly fun things.</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {games.map((game) => (
          <Link href={`/${game.id}`} key={game.id}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`${game.color} h-48 rounded-2xl shadow-md flex items-center justify-center cursor-pointer border-4 border-black`}
            >
              <h2 className="text-2xl font-bold text-white shadow-sm">{game.title}</h2>
            </motion.div>
          </Link>
        ))}
      </div>
    </main>
  );
}