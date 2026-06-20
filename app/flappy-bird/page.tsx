import { Metadata } from 'next';
import FlappyGame from '@/components/FlappyGame';

export const metadata: Metadata = {
  title: 'Flappy Bird | KillTime',
  description: 'The classic frustrating bird game. Tap to flap, avoid the pipes, kill some time.',
};

export default function FlappyPage() {
  return <FlappyGame />;
}