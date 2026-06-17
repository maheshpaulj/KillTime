import { Metadata } from 'next';
import TrafficGame from '@/components/TrafficGame';

export const metadata: Metadata = {
  title: 'Traffic Run | Retro Highway Dodge',
  description: 'Master the lanes in Traffic Run, a fast-paced pixel art highway dodger. Can you beat the global high score?',
};

export default function Page() {
  return <TrafficGame />;
}