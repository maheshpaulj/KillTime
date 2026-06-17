import Link from 'next/link';

export default function Credits() {
  return (
    <main className="min-h-screen bg-[#f4f4f0] flex flex-col font-sans text-[#1e293b] p-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-12 flex items-center gap-4">
          <Link href="/" className="absolute top-4 left-4 z-50 bg-[#1e293b] text-white text-[10px] md:text-xs py-2 px-4 border-2 border-[#f8fafc] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-1">&larr; HUB</Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Credits</h1>
        </div>

        <div className="bg-white rounded-lg border-[4px] border-[#334155] shadow-[8px_8px_0px_rgba(0,0,0,0.2)] p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#60a5fa]">Sound Effects</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Explosion Sound</p>
                <p>Sound Effect by <a href="https://pixabay.com/users/u_b32baquv5u-50250111/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340462" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">u_b32baquv5u</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340462" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">Pixabay</a></p>
              </div>

              <div>
                <p className="font-semibold mb-1">Background Music</p>
                <p>Sound Effect by <a href="https://pixabay.com/users/lucadialessandro-25927643/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=295434" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">Luca Di Alessandro</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=295434" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">Pixabay</a></p>
              </div>

              <div>
                <p className="font-semibold mb-1">Game Over Sound</p>
                <p>Sound Effect by <a href="https://pixabay.com/users/floraphonic-38928062/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=185108" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">floraphonic</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=185108" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">Pixabay</a></p>
              </div>

              <div>
                <p className="font-semibold mb-1">Button Click Sound</p>
                <p>Sound Effect by <a href="https://pixabay.com/users/floraphonic-38928062/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=185097" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">floraphonic</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=185097" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">Pixabay</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-[#60a5fa]">Inspiration</h2>
            <div className="text-sm">
              <p>Special thanks to <a href="https://www.youtube.com/@LinternetUser/" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">LInternetUser on YouTube</a> for inspiring the Traffic Run game!</p>
              <p>and mainly, <a href="https://neal.fun" target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:underline">neal.fun</a> for the creative inspiration</p>
            </div>
          </section>

          <section className="pt-4 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#64748b]">KillTime © 2026 | A collection of addictive mini-games</p>
          </section>
        </div>
      </div>
    </main>
  );
}
