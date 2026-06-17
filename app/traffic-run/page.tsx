import TrafficGame from '@/components/TrafficGame';
import Link from 'next/link';

export default function TrafficRunPage() {
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col items-center py-10">
      <Link href="/" className="text-white mb-6 hover:underline font-mono">
        &larr; Back to Hub
      </Link>
      <TrafficGame />
    </div>
  );
}