'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';
type Pipe = { x: number; topHeight: number; bottomY: number; passed: boolean; };

// Authentic Physics Constants
const GRAVITY = 0.25;
const FLAP_STRENGTH = -4.5;
const PIPE_SPEED = 2;
const PIPE_WIDTH = 52;
const PIPE_GAP = 120;
const BIRD_W = 34;
const BIRD_H = 24;
const BASE_HEIGHT = 112;

const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('flappy_deviceId');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('flappy_deviceId', id);
  }
  return id;
};

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);
  const [personalBest, setPersonalBest] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRefs = useRef<{ flap?: HTMLAudioElement; score?: HTMLAudioElement; hit?: HTMLAudioElement; die?: HTMLAudioElement; swoosh?: HTMLAudioElement; }>({});
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const themeRef = useRef({ bg: 'day', pipe: 'green', bird: 'yellow' });

  const engine = useRef({
    birdY: 240,
    velocity: 0,
    pipes: [] as Pipe[],
    frames: 0,
    animationId: 0,
    isDead: false,
  });

  useEffect(() => {
    setMounted(true);
    setPersonalBest(Number(localStorage.getItem('flappy_personalBest') || 0));
    setPlayerName(localStorage.getItem('flappy_playerName') || '');
    
    fetch('/api/flappy-scores')
      .then(res => res.ok ? res.json() : [])
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(console.error);
    
    if (typeof window !== 'undefined') {
      audioRefs.current.flap = new Audio('/sfx/flappy-bird/wing.wav');
      audioRefs.current.score = new Audio('/sfx/flappy-bird/point.wav');
      audioRefs.current.hit = new Audio('/sfx/flappy-bird/hit.wav');
      audioRefs.current.die = new Audio('/sfx/flappy-bird/die.wav');
      audioRefs.current.swoosh = new Audio('/sfx/flappy-bird/swoosh.wav');
      
      // Set baseline volumes to 0.4
      Object.values(audioRefs.current).forEach(a => { if(a) a.volume = 0.4; });

      const loadImg = (src: string) => { const img = new Image(); img.src = src; return img; };
      imagesRef.current = {
        bgDay: loadImg('/sprites/flappy-bird/background-day.png'),
        bgNight: loadImg('/sprites/flappy-bird/background-night.png'),
        base: loadImg('/sprites/flappy-bird/base.png'),
        pipeGreen: loadImg('/sprites/flappy-bird/pipe-green.png'),
        pipeRed: loadImg('/sprites/flappy-bird/pipe-red.png'),
        msg: loadImg('/sprites/flappy-bird/message.png'),
        gameover: loadImg('/sprites/flappy-bird/gameover.png'),
        yellowDown: loadImg('/sprites/flappy-bird/yellowbird-downflap.png'),
        yellowMid: loadImg('/sprites/flappy-bird/yellowbird-midflap.png'),
        yellowUp: loadImg('/sprites/flappy-bird/yellowbird-upflap.png'),
        blueDown: loadImg('/sprites/flappy-bird/bluebird-downflap.png'),
        blueMid: loadImg('/sprites/flappy-bird/bluebird-midflap.png'),
        blueUp: loadImg('/sprites/flappy-bird/bluebird-upflap.png'),
        redDown: loadImg('/sprites/flappy-bird/redbird-downflap.png'),
        redMid: loadImg('/sprites/flappy-bird/redbird-midflap.png'),
        redUp: loadImg('/sprites/flappy-bird/redbird-upflap.png'),
      };
    }
  }, []);

  // Update muted state of audio elements when toggle is clicked
  useEffect(() => {
    Object.values(audioRefs.current).forEach(a => {
      if (a) a.muted = isMuted;
    });
  }, [isMuted]);

  const triggerGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    if (audioRefs.current.swoosh) audioRefs.current.swoosh.play().catch(() => {});
    
    setScore(finalScore => {
      const currentBest = Number(localStorage.getItem('flappy_personalBest') || 0);
      if (finalScore > currentBest) {
        localStorage.setItem('flappy_personalBest', finalScore.toString());
        setPersonalBest(finalScore);
        if (!localStorage.getItem('flappy_playerName')) setShowNameModal(true);
        else submitScore(localStorage.getItem('flappy_playerName') || 'Guest', finalScore);
      }
      return finalScore;
    });
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 288;   
    const height = 512; 
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      const state = engine.current;
      const imgs = imagesRef.current;
      state.frames++;

      state.velocity += GRAVITY;
      state.birdY += state.velocity;

      if (!state.isDead) {
        if (state.frames % 100 === 0) { 
          const minPipeY = 50;
          const maxPipeY = height - BASE_HEIGHT - PIPE_GAP - 50;
          const topHeight = Math.floor(Math.random() * (maxPipeY - minPipeY + 1) + minPipeY);
          state.pipes.push({ x: width, topHeight, bottomY: topHeight + PIPE_GAP, passed: false });
        }

        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= PIPE_SPEED;

          const birdLeft = 50 - BIRD_W/2 + 4; const birdRight = 50 + BIRD_W/2 - 4;
          const birdTop = state.birdY - BIRD_H/2 + 4; const birdBot = state.birdY + BIRD_H/2 - 4;
          
          const hitX = birdRight > p.x && birdLeft < p.x + PIPE_WIDTH;
          const hitTopY = birdTop < p.topHeight;
          const hitBottomY = birdBot > p.bottomY;

          if (hitX && (hitTopY || hitBottomY)) {
            state.isDead = true;
            if (audioRefs.current.hit) audioRefs.current.hit.play().catch(() => {});
          }

          if (p.x + PIPE_WIDTH < 50 && !p.passed) {
            p.passed = true;
            setScore(s => {
              if (audioRefs.current.score) { audioRefs.current.score.currentTime = 0; audioRefs.current.score.play().catch(() => {}); }
              return s + 1;
            });
          }

          if (p.x + PIPE_WIDTH < 0) state.pipes.splice(i, 1);
        }
      }

      if (state.birdY <= 0) { state.birdY = 0; state.velocity = 0; }
      if (state.birdY + BIRD_H/2 >= height - BASE_HEIGHT) {
        state.birdY = height - BASE_HEIGHT - BIRD_H/2;
        if (!state.isDead && audioRefs.current.hit) audioRefs.current.hit.play().catch(() => {});
        if (audioRefs.current.die) audioRefs.current.die.play().catch(() => {});
        triggerGameOver();
        return; 
      }

      ctx.clearRect(0, 0, width, height);

      const bg = themeRef.current.bg === 'day' ? imgs.bgDay : imgs.bgNight;
      if (bg?.complete) ctx.drawImage(bg, 0, 0, width, height);

      const pipeImg = themeRef.current.pipe === 'green' ? imgs.pipeGreen : imgs.pipeRed;
      state.pipes.forEach(p => {
        if (pipeImg?.complete) {
          ctx.save();
          ctx.translate(p.x, p.topHeight);
          ctx.scale(1, -1);
          ctx.drawImage(pipeImg, 0, 0, PIPE_WIDTH, 320); 
          ctx.restore();
          ctx.drawImage(pipeImg, p.x, p.bottomY, PIPE_WIDTH, 320);
        }
      });

      const baseX = state.isDead ? 0 : -(state.frames * PIPE_SPEED) % 24; 
      if (imgs.base?.complete) ctx.drawImage(imgs.base, baseX, height - BASE_HEIGHT, 336, BASE_HEIGHT);

      const birdColor = themeRef.current.bird;
      let birdSprite;
      
      if (state.isDead || state.velocity > 4) {
          birdSprite = imgs[`${birdColor}Mid`];
      } else {
          const flapState = Math.floor(state.frames / 5) % 4;
          if (flapState === 0) birdSprite = imgs[`${birdColor}Down`];
          else if (flapState === 1 || flapState === 3) birdSprite = imgs[`${birdColor}Mid`];
          else birdSprite = imgs[`${birdColor}Up`];
      }

      if (birdSprite?.complete) {
        ctx.save();
        ctx.translate(50, state.birdY);
        let rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 6, (state.velocity * 0.1)));
        if (state.isDead) rotation = Math.PI / 2; 
        
        ctx.rotate(rotation);
        ctx.drawImage(birdSprite, -BIRD_W/2, -BIRD_H/2, BIRD_W, BIRD_H);
        ctx.restore();
      }

      state.animationId = requestAnimationFrame(render);
    };

    engine.current.animationId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(engine.current.animationId);
  }, [gameState, triggerGameOver]);

  const flap = useCallback((e?: React.SyntheticEvent | KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault(); 

    if (gameState === 'PLAYING' && !engine.current.isDead) {
      engine.current.velocity = FLAP_STRENGTH;
      if (audioRefs.current.flap) {
        audioRefs.current.flap.currentTime = 0; audioRefs.current.flap.play().catch(() => {});
      }
    } else if (gameState === 'START' || (gameState === 'GAMEOVER' && !showNameModal)) {
      const bgs = ['day', 'night'];
      const pipes = ['green', 'red'];
      const birds = ['yellow', 'blue', 'red'];
      themeRef.current = {
          bg: bgs[Math.floor(Math.random() * bgs.length)],
          pipe: pipes[Math.floor(Math.random() * pipes.length)],
          bird: birds[Math.floor(Math.random() * birds.length)],
      };

      engine.current = { birdY: 240, velocity: FLAP_STRENGTH, pipes: [], frames: 0, animationId: 0, isDead: false };
      setScore(0);
      setGameState('PLAYING');
      if (audioRefs.current.swoosh) audioRefs.current.swoosh.play().catch(() => {});
      if (audioRefs.current.flap) audioRefs.current.flap.play().catch(() => {});
    }
  }, [gameState, showNameModal]);

  const submitScore = async (name: string, scoreToSubmit: number) => {
    setIsSubmitting(true);
    const finalName = name.trim() || `Guest_${Math.floor(Math.random() * 9999)}`;
    localStorage.setItem('flappy_playerName', finalName);
    setPlayerName(finalName);
    
    try {
      await fetch('/api/flappy-scores', {
        method: 'POST',
        body: JSON.stringify({ deviceId: getOrCreateDeviceId(), name: finalName, score: scoreToSubmit }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await fetch('/api/flappy-scores');
      if (res.ok) setLeaderboard(await res.json());
    } catch (e) { console.error("Error submitting score", e); }
    
    setIsSubmitting(false);
    setShowNameModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') flap(e); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  if (!mounted) return null;

  return (
    // Removed `onPointerDown` from the background wrapper to prevent errant clicks
    <div className="fixed inset-0 w-full h-full bg-[#1e293b] flex items-center justify-center font-pixel overflow-hidden touch-none select-none">
      <Link href="/" className="absolute top-4 left-4 z-[60] bg-[#f8fafc] text-[#1e293b] text-[10px] md:text-xs py-2 px-4 border-2 border-[#1e293b] shadow-[2px_2px_0px_#f8fafc] hover:translate-y-1 hover:shadow-none transition-all">
        &larr; HUB
      </Link>

      <div className="flex w-full h-full max-w-[1400px] items-center justify-center px-4">
        <div className="hidden lg:block flex-1" />

        {/* SCOPED FLAP AREA - onPointerDown is now attached only to the game canvas container */}
        <div 
          className="bg-[#f8fafc] p-2 sm:p-4 rounded border-[6px] border-[#334155] shadow-[12px_12px_0px_rgba(0,0,0,0.4)] h-[85vh] lg:h-[95vh] aspect-[9/16] max-h-[850px] relative shrink-0 z-10 overflow-hidden flex flex-col items-center justify-center cursor-pointer"
          onPointerDown={flap}
        >
          
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
             <div className="bg-[#ded895] border-[3px] border-[#543847] px-3 py-1 rounded shadow-[3px_3px_0px_#000] flex flex-col items-center pointer-events-auto">
                <span className="text-[#e2711d] font-black text-[10px] leading-tight text-shadow-sm tracking-widest">BEST</span>
                <span className="text-xl font-black text-white drop-shadow-[0_2px_0px_#000] leading-tight" style={{ WebkitTextStroke: '1px black' }}>
                {personalBest}
                </span>
            </div>

             {/* SFX TOGGLE BUTTON */}
             <button 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                onPointerDown={(e) => e.stopPropagation()} // Prevents tapping the button from triggering a flap
                className="z-10 relative w-8 h-8 bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center hover:bg-[#0f172a] transition-colors pointer-events-auto" title="Toggle SFX"
             >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white" className={isMuted ? 'opacity-100' : 'opacity-40'}><rect x="2" y="6" width="4" height="4"/><polygon points="6,6 10,2 10,14 6,10" /><rect x="12" y="5" width="2" height="6"/><rect x="15" y="3" width="2" height="10"/></svg>
                  {isMuted && <div className="absolute w-10 border-b-2 border-red-500 rotate-45" />}
             </button>
          </div>

          {/* DYNAMIC SCORE */}
          {gameState === 'PLAYING' && !engine.current.isDead && (
            <div className="absolute top-16 z-20 text-6xl font-black text-white text-shadow-xl drop-shadow-[0_4px_0px_#000] pointer-events-none">
              {score}
            </div>
          )}

          <canvas 
            ref={canvasRef} 
            width={288} 
            height={512} 
            className="absolute inset-0 w-full h-full bg-black object-cover"
            style={{ imageRendering: 'pixelated' }}
          />

          {showNameModal && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-6 text-center pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
              <h3 className="text-[#fbbf24] text-sm mb-4 font-bold">NEW HIGH SCORE!</h3>
              <input 
                type="text" maxLength={10} placeholder="ENTER NAME" value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="w-full max-w-[200px] bg-[#1e293b] text-white border-4 border-[#94a3b8] p-3 mb-4 text-center focus:outline-none"
              />
              <button disabled={isSubmitting} onClick={() => submitScore(playerName, score)} className="bg-[#4ade80] text-[#1e293b] w-full max-w-[200px] py-3 border-4 border-[#166534] hover:bg-[#22c55e] active:translate-y-1 mb-2 font-bold">
                {isSubmitting ? 'SAVING...' : 'SAVE SCORE'}
              </button>
              <button onClick={() => setShowNameModal(false)} className="text-white text-[10px] underline">Skip</button>
            </div>
          )}

          {gameState === 'START' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none pb-24">
              <img src="/sprites/flappy-bird/message.png" alt="Get Ready" className="w-[184px] h-[267px] object-contain animate-pulse" style={{ imageRendering: 'pixelated' }} />
            </div>
          )}

          {gameState === 'GAMEOVER' && !showNameModal && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none pb-12">
              <img src="/sprites/flappy-bird/gameover.png" alt="Game Over" className="w-[192px] h-[42px] object-contain mb-6 animate-bounce" style={{ imageRendering: 'pixelated' }} />
              
              <div className="bg-[#ded895] border-4 border-[#543847] p-4 rounded shadow-[4px_4px_0px_#000] flex flex-col items-center w-56 mb-8 relative overflow-hidden">
                <span className="text-[#e2711d] font-black text-sm mb-1 text-shadow-sm">SCORE</span>
                <span className="text-4xl font-black text-white drop-shadow-[0_2px_0px_#000] mb-3">{score}</span>
                <span className="text-[#e2711d] font-black text-sm mb-1 text-shadow-sm">BEST</span>
                <span className="text-4xl font-black text-white drop-shadow-[0_2px_0px_#000]">{Math.max(score, personalBest)}</span>
              </div>
            </div>
          )}

        </div>

        {/* LEADERBOARD (RIGHT) */}
        <div className="hidden lg:flex flex-1 justify-start pl-8 z-10">
          <div className="flex flex-col bg-[#f8fafc] p-4 rounded border-[6px] border-[#334155] shadow-[12px_12px_0px_rgba(0,0,0,0.4)] h-[80vh] max-h-[700px] w-full max-w-[320px]">
            <div className="bg-[#fbbf24] text-[#1e293b] p-3 mb-4 border-4 border-[#334155] text-center shadow-inner">
              <h2 className="font-bold text-sm tracking-widest">GLOBAL TOP 10</h2>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
              {leaderboard.length === 0 ? (
                <p className="text-center text-[#64748b] text-xs mt-10">NO SCORES YET</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#e2e8f0] p-3 border-2 border-[#94a3b8] text-[10px] text-[#1e293b]">
                    <div className="flex gap-3"><span className="font-bold text-[#64748b]">#{idx + 1}</span><span>{entry.name.split('#')[0]}</span></div>
                    <span className="font-bold">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}