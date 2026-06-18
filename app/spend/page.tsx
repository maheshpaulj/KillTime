import { Metadata } from 'next';
import SpendGame from '@/components/SpendGame';

export const metadata: Metadata = {
  title: 'Spend Elon\'s Money | KillTime',
  description: 'You have $1 Trillion. Can you spend it all? Buy everything from coffee to private islands.',
};

export default function SpendPage() {
  return <SpendGame />;
}