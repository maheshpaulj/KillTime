import { Press_Start_2P } from 'next/font/google';

// Load the font only for this route
const pixelFont = Press_Start_2P({ 
  weight: '400', 
  subsets: ['latin'],
  variable: '--font-pixel' // CSS variable we will use in Tailwind
});

export default function TrafficRunLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    // Apply the font variable and the tailwind class to this specific wrapper
    <div className={`${pixelFont.variable} font-pixel`}>
      {children}
    </div>
  );
}