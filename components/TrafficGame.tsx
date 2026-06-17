'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Enemy = {
  x: number;
  y: number;
  width: number;
  height: number;
  relativeSpeed: number;
  isTruck: boolean;
  image: HTMLImageElement;
  targetLane: number | null;
  blinking: boolean;
  blinkTimer: number;
};

export default function TrafficGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Audio & Interaction State
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const isSoundOnRef = useRef(true);
  const audioRefs = useRef<{
    music?: HTMLAudioElement;
    explosion?: HTMLAudioElement;
    gameover?: HTMLAudioElement;
    button?: HTMLAudioElement;
  }>({});

  const playerPosRef = useRef(50); 
  const gameStateRef = useRef({
    frames: 0,
    score: 0,
    enemies: [] as Enemy[],
    gameOver: false,
    crashFrame: 0, 
    crashTimer: 0,
    gameOverSoundPlayed: false,
  });

  useEffect(() => {
    isSoundOnRef.current = isSoundOn;
  }, [isSoundOn]);

  useEffect(() => {
    if (hasInteracted && isMusicOn && !gameStateRef.current.gameOver) {
      if (audioRefs.current.music) {
         // Lock volume at 50%
         audioRefs.current.music.volume = 0.1; 
         audioRefs.current.music.play().catch(e => console.log('Audio blocked:', e));
      }
    } else {
      audioRefs.current.music?.pause();
    }
  }, [isMusicOn, hasInteracted]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRefs.current.music = new Audio('/sfx/traffic-run/music.mp3');
      audioRefs.current.music.loop = true;
      audioRefs.current.explosion = new Audio('/sfx/traffic-run/explosion.mp3');
      audioRefs.current.gameover = new Audio('/sfx/traffic-run/gameover.mp3');
      audioRefs.current.button = new Audio('/sfx/traffic-run/button.mp3');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const imgCarMain = new Image();
    imgCarMain.src = '/sprites/traffic-run/car_main.png';
    const imgExplosion = new Image();
    imgExplosion.src = '/sprites/traffic-run/explosion.png';
    const imgBg = new Image();
    imgBg.src = '/sprites/traffic-run/bg.png';

    const carImgs = [1, 2, 3, 4].map(i => {
      const img = new Image();
      img.src = `/sprites/traffic-run/car_${i}.png`;
      return img;
    });
    const truckImgs = [1, 2, 3, 4].map(i => {
      const img = new Image();
      img.src = `/sprites/traffic-run/truck_${i}.png`;
      return img;
    });

    let animationFrameId: number;
    let bgY = 0;
    
    const internalWidth = 301; 
    const internalHeight = 602; 
    const carW = 26; 
    const carH = 46;
    const truckW = 32;
    const truckH = 105;
    const lanes = [78.5, 126.5, 174.5, 222.5];

    const spawnEnemy = (currentRoadSpeed: number) => {
      const state = gameStateRef.current;
      const laneIndex = Math.floor(Math.random() * lanes.length);
      const laneCenter = lanes[laneIndex];
      
      // 1. Basic check: Don't spawn directly on top of another car
      const isLaneClear = !state.enemies.some((e) => 
        Math.abs(e.x + (e.width / 2) - laneCenter) < 10 && e.y < 110
      );

      if (!isLaneClear) return;

      // 2. ANTI "WALL OF DEATH" LOGIC
      // Count how many distinct lanes are occupied in the top 250 pixels
      const occupiedLanes = new Set<number>();
      state.enemies.forEach(e => {
        if (e.y < 250) {
            let minDiff = 999;
            let nearestIdx = 0;
            lanes.forEach((lx, idx) => {
                if (Math.abs(lx - (e.x + e.width/2)) < minDiff) {
                    minDiff = Math.abs(lx - (e.x + e.width/2));
                    nearestIdx = idx;
                }
            });
            occupiedLanes.add(nearestIdx);
        }
      });

      // If 3 lanes are already occupied, and the game tries to spawn in the 4th (empty) lane... abort!
      if (occupiedLanes.size >= 3 && !occupiedLanes.has(laneIndex)) {
          return; // This guarantees at least one lane is always open
      }

      const isTruck = Math.random() > 0.7;
      const imgArray = isTruck ? truckImgs : carImgs;
      const randomImage = imgArray[Math.floor(Math.random() * imgArray.length)];
      const w = isTruck ? truckW : carW;

      state.enemies.push({
        x: laneCenter - (w / 2),
        y: -150,
        width: w,
        height: isTruck ? truckH : carH,
        relativeSpeed: Math.random() * 1.5 + 0.5, 
        isTruck,
        image: randomImage,
        targetLane: null,
        blinking: false,
        blinkTimer: 0,
      });
    };

    const render = () => {
      const state = gameStateRef.current;

      const currentRoadSpeed = Math.min(10, 4 + Math.floor(state.score / 1500));
      const spawnRate = Math.max(15, 40 - Math.floor(state.score / 400));

      state.frames++;
      if (!state.gameOver) state.score++;

      if (state.frames % 10 === 0 && !state.gameOver) {
        setDisplayScore(Math.floor(state.score / 10));
      }

      ctx.clearRect(0, 0, internalWidth, internalHeight);

      if (!state.gameOver) {
        bgY += currentRoadSpeed;
        if (bgY >= internalHeight) bgY = 0;
      }

      if (imgBg.complete && imgBg.naturalWidth > 0) {
        ctx.drawImage(imgBg, 0, bgY, internalWidth, internalHeight);
        ctx.drawImage(imgBg, 0, bgY - internalHeight, internalWidth, internalHeight);
      } else {
        ctx.fillStyle = '#6b7280'; 
        ctx.fillRect(57, 0, internalWidth - 114, internalHeight);
        ctx.fillStyle = '#4ade80'; 
        ctx.fillRect(0, 0, 57, internalHeight);
        ctx.fillRect(internalWidth - 57, 0, 57, internalHeight);
        ctx.fillStyle = '#ffffff';
        [102, 150, 198].forEach((x) => {
          for (let j = -1; j < internalHeight / 40; j++) {
            ctx.fillRect(x, (j * 60) + (state.frames * currentRoadSpeed) % 60, 5, 30);
          }
        });
      }

      const minX = 57; 
      const maxX = internalWidth - 57 - carW; 
      const playerX = minX + (playerPosRef.current / 100) * (maxX - minX);
      
      // NEW: Increased bottom margin to 100px for better visibility
      const playerY = internalHeight - carH - 100;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;

      if (state.frames % spawnRate === 0 && !state.gameOver) spawnEnemy(currentRoadSpeed); 

      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        
        if (!state.gameOver) {
          e.y += (currentRoadSpeed - e.relativeSpeed);

          if (!e.isTruck && e.y > 0 && e.y < internalHeight - 150 && !e.targetLane && Math.random() < 0.005) {
            const currentLaneCenter = e.x + (e.width / 2);
            let closestLaneIdx = 0;
            let minDiff = 999;
            lanes.forEach((laneX, idx) => {
               if(Math.abs(laneX - currentLaneCenter) < minDiff) {
                   minDiff = Math.abs(laneX - currentLaneCenter);
                   closestLaneIdx = idx;
               }
            });

            const direction = Math.random() > 0.5 ? 1 : -1;
            const nextLaneIdx = closestLaneIdx + direction;

            if (nextLaneIdx >= 0 && nextLaneIdx < lanes.length) {
                const potentialTargetLane = lanes[nextLaneIdx];
                const isSafeToSwitch = !state.enemies.some((other) => {
                    if (other === e) return false;
                    const otherLaneX = other.targetLane !== null ? other.targetLane : (other.x + other.width / 2);
                    const isInTargetLane = Math.abs(otherLaneX - potentialTargetLane) < 20; 
                    const isTooCloseVertically = Math.abs(other.y - e.y) < 120; 
                    return isInTargetLane && isTooCloseVertically;
                });

                if (isSafeToSwitch) {
                    e.targetLane = potentialTargetLane;
                    e.blinking = true;
                    e.blinkTimer = 45; 
                }
            }
          }

          if (e.targetLane) {
              if (e.blinkTimer > 0) {
                  e.blinkTimer--;
              } else {
                  e.blinking = false;
                  const targetX = e.targetLane - (e.width / 2);
                  const switchSpeed = 0.6; 
                  
                  if (e.x < targetX) e.x += switchSpeed;
                  if (e.x > targetX) e.x -= switchSpeed;
                  
                  if (Math.abs(e.x - targetX) <= switchSpeed) {
                      e.x = targetX; 
                      e.targetLane = null;
                  }
              }
          }
        }

        ctx.drawImage(e.image, e.x, e.y, e.width, e.height);

        if (e.blinking && state.frames % 10 < 5) {
            ctx.shadowColor = 'transparent'; 
            ctx.fillStyle = '#fbbf24';
            const isBlinkingLeft = e.targetLane! < e.x + (e.width/2);
            const blinkX = isBlinkingLeft ? e.x : e.x + e.width - 4;
            ctx.fillRect(blinkX, e.y + e.height - 6, 4, 4); 
            ctx.fillRect(blinkX, e.y + 2, 4, 4); 
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        }

        if (
          !state.gameOver &&
          playerX + 2 < e.x + e.width - 2 &&
          playerX + carW - 2 > e.x + 2 &&
          playerY + 2 < e.y + e.height - 2 &&
          playerY + carH - 2 > e.y + 2
        ) {
          state.gameOver = true;
          setIsGameOver(true);
          
          audioRefs.current.music?.pause();
          if (isSoundOnRef.current && audioRefs.current.explosion) {
            audioRefs.current.explosion.currentTime = 0;
            audioRefs.current.explosion.play().catch(console.error);
          }
        }

        if (e.y > internalHeight) state.enemies.splice(i, 1);
      }

      if (!state.gameOver) {
        ctx.drawImage(imgCarMain, playerX, playerY, carW, carH);
        ctx.shadowColor = 'transparent';
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.shadowColor = 'transparent';
        const totalFrames = 12;
        const frameW = 96; 
        const frameH = 96;

        if (state.crashFrame < totalFrames) {
          if (state.crashTimer % 4 === 0) state.crashFrame++;
          
          const sourceX = state.crashFrame * frameW;
          const drawX = playerX + (carW / 2) - (frameW / 2);
          const drawY = playerY + (carH / 2) - (frameH / 2);

          ctx.drawImage(imgExplosion, sourceX, 0, frameW, frameH, drawX, drawY, frameW, frameH);
          
          state.crashTimer++;
          animationFrameId = requestAnimationFrame(render);
        } else {
          if (!state.gameOverSoundPlayed && isSoundOnRef.current && audioRefs.current.gameover) {
            state.gameOverSoundPlayed = true;
            audioRefs.current.gameover.currentTime = 0;
            audioRefs.current.gameover.play().catch(console.error);
          }

          const sourceX = 11 * frameW;
          const drawX = playerX + (carW / 2) - (frameW / 2);
          const drawY = playerY + (carH / 2) - (frameH / 2);
          ctx.drawImage(imgExplosion, sourceX, 0, frameW, frameH, drawX, drawY, frameW, frameH);
        }
      }
    };

    imgCarMain.onload = () => render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleInteraction = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInteraction();
    playerPosRef.current = Number(e.target.value);
  };

  const restart = () => {
    if (isSoundOn && audioRefs.current.button) {
      audioRefs.current.button.currentTime = 0;
      audioRefs.current.button.play().catch(console.error);
    }
    
    // DELAY the reload so the sound has time to play
    setTimeout(() => {
      window.location.reload(); 
    }, 300);
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-[#8b9bb4] flex items-center justify-center font-pixel overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-50 bg-[#1e293b] text-white text-[10px] md:text-xs py-2 px-4 border-2 border-[#f8fafc] hover:bg-[#334155] active:translate-y-1 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-transform"
      >
        &larr; HUB
      </Link>

      <div className="bg-[#f8fafc] p-2 sm:p-4 rounded border-[6px] border-[#334155] shadow-[12px_12px_0px_rgba(0,0,0,0.4)] h-[95vh] aspect-[1/2] max-h-[850px] flex flex-col items-center">
        
        {/* NEW TITLE & PIXEL AUDIO CONTROLS */}
        <div className="w-full bg-[#60a5fa] text-white p-2 mb-2 border-4 border-[#334155] flex flex-col gap-2">
           <div className="flex justify-between items-center text-[10px] md:text-xs">
             <h1 className="font-bold text-shadow-sm tracking-wider">TRAFFIC RUN</h1>
             <div className="flex gap-2">
               
               {/* Pixel Music Note Button */}
               <button 
                 onClick={() => setIsMusicOn(!isMusicOn)} 
                 className="relative w-8 h-8 bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center hover:bg-[#0f172a] active:translate-y-px transition-colors"
                 title="Toggle Music"
               >
                 <svg width="14" height="14" viewBox="0 0 16 16" fill="white" className={isMusicOn ? 'opacity-100' : 'opacity-40'}>
                   <rect x="3" y="10" width="4" height="4"/>
                   <rect x="9" y="8" width="4" height="4"/>
                   <rect x="6" y="2" width="2" height="10"/>
                   <rect x="12" y="2" width="2" height="8"/>
                   <rect x="6" y="2" width="8" height="2"/>
                 </svg>
                 {!isMusicOn && <div className="absolute w-10 border-b-2 border-red-500 rotate-45" />}
               </button>

               {/* Pixel Speaker Button */}
               <button 
                 onClick={() => setIsSoundOn(!isSoundOn)} 
                 className="relative w-8 h-8 bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center hover:bg-[#0f172a] active:translate-y-px transition-colors"
                 title="Toggle SFX"
               >
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="white" className={isSoundOn ? 'opacity-100' : 'opacity-40'}>
                   <rect x="2" y="6" width="4" height="4"/>
                   <polygon points="6,6 10,2 10,14 6,10" />
                   <rect x="12" y="5" width="2" height="6"/>
                   <rect x="15" y="3" width="2" height="10"/>
                 </svg>
                 {!isSoundOn && <div className="absolute w-10 border-b-2 border-red-500 rotate-45" />}
               </button>

             </div>
           </div>
           
           <div className="w-full text-left text-[10px] px-1 text-[#1e293b] mt-1 font-bold">
             SCORE: {displayScore}
           </div>
        </div>
        
        <div className="w-full flex-grow border-4 border-[#334155] bg-[#d1d5db] relative overflow-hidden flex justify-center items-center">
          <canvas 
            ref={canvasRef} 
            width={301} 
            height={602} 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />

          {isGameOver && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 p-4">
              <h2 className="text-white text-2xl mb-6 text-shadow-md animate-bounce">CRASH!</h2>
              <button 
                onClick={restart}
                className="bg-[#ef4444] text-white text-xs sm:text-sm py-4 px-8 border-4 border-[#7f1d1d] hover:bg-[#dc2626] active:translate-y-1 active:border-b-4 shadow-[4px_4px_0px_#7f1d1d] transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>
        
        <div className="w-full mt-2 bg-[#f1f5f9] p-3 border-4 border-[#334155] shadow-inner">
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="50"
            onChange={handleSliderChange}
            onPointerDown={handleInteraction}
            disabled={isGameOver}
            className="pixel-slider"
          />
        </div>

      </div>
    </div>
  );
}