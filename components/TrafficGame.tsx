'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Enemy = { x: number; y: number; width: number; height: number; relativeSpeed: number; isTruck: boolean; image: HTMLImageElement; targetLane: number | null; blinking: boolean; blinkTimer: number; };

const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('traffic_deviceId');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('traffic_deviceId', id);
  }
  return id;
};

export default function TrafficGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // FIX 1: Hydration safe states. Default to safe values, update after mount.
  const [mounted, setMounted] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);
  const [personalBest, setPersonalBest] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSoundOnRef = useRef(true);
  const audioRefs = useRef<{ music?: HTMLAudioElement; explosion?: HTMLAudioElement; gameover?: HTMLAudioElement; button?: HTMLAudioElement; }>({});

  const playerPosRef = useRef(50);
  const playerVelocityRef = useRef(0); // Steering velocity for friction/momentum
  const playerAccelerationRef = useRef(0.6); // How fast steering accelerates
  const playerFrictionRef = useRef(0.82); // Friction coefficient (lower = more friction)
  const gameStateRef = useRef({ frames: 0, score: 0, enemies: [] as Enemy[], gameOver: false, crashFrame: 0, crashTimer: 0, gameOverSoundPlayed: false });

  // FIX 1 cont: Run local storage checks ONLY after the first render
  useEffect(() => {
    setMounted(true);
    setIsMusicOn(localStorage.getItem('traffic_music') !== 'false');
    setIsSoundOn(localStorage.getItem('traffic_sfx') !== 'false');
    setPlayerName(localStorage.getItem('traffic_playerName') || '');
    setPersonalBest(Number(localStorage.getItem('traffic_personalBest') || 0));

    fetch('/api/scores')
      .then(res => {
        if (!res.ok) throw new Error("API Route Missing or Failing");
        return res.json();
      })
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(err => console.error("Leaderboard fetch error (Is route.ts created?):", err));
  }, []);

  // Save Audio Prefs
  useEffect(() => { if (mounted) localStorage.setItem('traffic_music', isMusicOn.toString()); }, [isMusicOn, mounted]);
  useEffect(() => {
    if (mounted) localStorage.setItem('traffic_sfx', isSoundOn.toString());
    isSoundOnRef.current = isSoundOn;
  }, [isSoundOn, mounted]);

  // Keep background music in sync with toggle / interaction / game-over state
  useEffect(() => {
    const audio = audioRefs.current.music;
    if (!audio) return;
    if (document.hidden || !isMusicOn || isGameOver || !hasInteracted) {
      audio.pause();
    } else {
      audio.volume = 0.1;
      audio.play().catch((e) => console.log('Audio blocked:', e));
    }
  }, [isMusicOn, hasInteracted, isGameOver]);

  // Handle tab switching separately so it doesn't fight with the sync effect above
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRefs.current.music;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
      } else if (hasInteracted && isMusicOn && !isGameOver) {
        audio.play().catch((e) => console.log('Audio blocked:', e));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isMusicOn, hasInteracted, isGameOver]);

  // FIX: capture the very first interaction ANYWHERE on the page (not just the slider)
  // so music starts as soon as the game is actually running.
  useEffect(() => {
    if (hasInteracted) return;
    const trigger = () => {
      setHasInteracted(true);
      if (isMusicOn && audioRefs.current.music) {
        audioRefs.current.music.volume = 0.1;
        audioRefs.current.music.play().catch((e) => console.log('Audio blocked:', e));
      }
    };
    window.addEventListener('pointerdown', trigger, { once: true });
    window.addEventListener('keydown', trigger, { once: true });
    return () => {
      window.removeEventListener('pointerdown', trigger);
      window.removeEventListener('keydown', trigger);
    };
  }, [hasInteracted, isMusicOn]);

  // Keyboard steering control with friction/momentum
  useEffect(() => {
    const keysPressed = { ArrowLeft: false, ArrowRight: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        keysPressed.ArrowLeft = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        keysPressed.ArrowRight = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        keysPressed.ArrowLeft = false;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        keysPressed.ArrowRight = false;
        e.preventDefault();
      }
    };

    // Apply steering input each frame
    const updateSteering = () => {
      if (keysPressed.ArrowLeft) {
        playerVelocityRef.current = Math.max(playerVelocityRef.current - playerAccelerationRef.current, -3); // Cap max speed
      } else if (keysPressed.ArrowRight) {
        playerVelocityRef.current = Math.min(playerVelocityRef.current + playerAccelerationRef.current, 3); // Cap max speed
      } else {
        // Apply friction when no keys pressed
        playerVelocityRef.current *= playerFrictionRef.current;
      }

      // Update position with velocity
      playerPosRef.current += playerVelocityRef.current;

      // Clamp to bounds [0, 100]
      playerPosRef.current = Math.max(0, Math.min(100, playerPosRef.current));
    };

    // Run steering update every frame (tied to animation frame)
    let animId: number;
    const steeringLoop = () => {
      updateSteering();
      animId = requestAnimationFrame(steeringLoop);
    };
    animId = requestAnimationFrame(steeringLoop);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Cleanup audio completely when leaving the page
  useEffect(() => {
    return () => {
      if (audioRefs.current.music) {
        audioRefs.current.music.pause();
        audioRefs.current.music.src = '';
      }
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRefs.current.music) {
      audioRefs.current.music = new Audio('/sfx/traffic-run/music.mp3'); audioRefs.current.music.loop = true;
      audioRefs.current.explosion = new Audio('/sfx/traffic-run/explosion.mp3'); audioRefs.current.gameover = new Audio('/sfx/traffic-run/gameover.mp3'); audioRefs.current.button = new Audio('/sfx/traffic-run/button.mp3');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    ctx.imageSmoothingEnabled = false;

    // Reset state perfectly to prevent React Strict Mode double-loop speeding bugs
    gameStateRef.current = { frames: 0, score: 0, enemies: [], gameOver: false, crashFrame: 0, crashTimer: 0, gameOverSoundPlayed: false };

    // --- LOAD IMAGES ---
    const imgCarMain = new Image(); imgCarMain.src = '/sprites/traffic-run/car_main.png';
    const imgExplosion = new Image(); imgExplosion.src = '/sprites/traffic-run/Explosion.png';
    const imgBg = new Image(); imgBg.src = '/sprites/traffic-run/bg.png';
    const carImgs = [1, 2, 3, 4].map(i => { const img = new Image(); img.src = `/sprites/traffic-run/car_${i}.png`; return img; });
    const truckImgs = [1, 2, 3, 4].map(i => { const img = new Image(); img.src = `/sprites/traffic-run/truck_${i}.png`; return img; });

    let animationFrameId: number; let bgY = 0;
    const internalWidth = 301; const internalHeight = 602;
    const carW = 26; const carH = 46; const truckW = 32; const truckH = 105;
    const lanes = [78.5, 126.5, 174.5, 222.5];
    const numLanes = lanes.length;

    // Helper: which lane index is closest to a given x-center
    const getLaneIndexForX = (xCenter: number) => {
      let nearestIdx = 0; let minDiff = Infinity;
      lanes.forEach((lx, idx) => {
        const d = Math.abs(lx - xCenter);
        if (d < minDiff) { minDiff = d; nearestIdx = idx; }
      });
      return nearestIdx;
    };

    // Helper: set of lane indices that currently contain at least one enemy
    // (uses targetLane when an enemy is mid lane-change, so it's accurate in real time)
    const getOccupiedLanes = (excludeEnemy?: Enemy) => {
      const occ = new Set<number>();
      gameStateRef.current.enemies.forEach((e) => {
        if (e === excludeEnemy) return;
        const xCenter = e.targetLane !== null ? e.targetLane : (e.x + e.width / 2);
        occ.add(getLaneIndexForX(xCenter));
      });
      return occ;
    };

    const spawnEnemy = () => {
      const state = gameStateRef.current;
      const occupied = getOccupiedLanes();
      const freeLanes = lanes.map((_, idx) => idx).filter((idx) => !occupied.has(idx));

      // FIX: always keep at least one lane completely empty so the player
      // always has a guaranteed path through — the game stays infinitely passable.
      if (freeLanes.length < 2) return;

      const laneIndex = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const laneCenter = lanes[laneIndex];

      const isTruck = Math.random() > 0.7;
      const imgArray = isTruck ? truckImgs : carImgs;
      const randomImage = imgArray[Math.floor(Math.random() * imgArray.length)];
      const w = isTruck ? truckW : carW;

      state.enemies.push({
        x: laneCenter - (w / 2), y: -150, width: w, height: isTruck ? truckH : carH,
        relativeSpeed: Math.random() * 1.5 + 0.5, isTruck, image: randomImage, targetLane: null, blinking: false, blinkTimer: 0,
      });
    };

    const handleCrash = () => {
      const state = gameStateRef.current;
      const finalScore = Math.floor(state.score / 10);

      state.gameOver = true;
      setIsGameOver(true);

      if (isSoundOnRef.current && audioRefs.current.explosion) {
        audioRefs.current.explosion.currentTime = 0;
        audioRefs.current.explosion.play().catch(console.error);
      }

      const currentBest = Number(localStorage.getItem('traffic_personalBest') || 0);
      if (finalScore > currentBest) {
        localStorage.setItem('traffic_personalBest', finalScore.toString());
        setPersonalBest(finalScore);

        if (!localStorage.getItem('traffic_playerName')) {
          setShowNameModal(true);
        } else {
          submitScore(localStorage.getItem('traffic_playerName') || 'Guest', finalScore, state.frames);
        }
      }
    };

    const render = () => {
      const state = gameStateRef.current;

      // FIX: smooth difficulty curve instead of sudden steps.
      // Speed/spawn-rate ease toward a cap (exponential approach) so the game ramps up
      // quickly at first, then keeps creeping up by tinier and tinier amounts forever.
      const baseSpeed = 4;
      const maxSpeed = 10;
      const speedRamp = 4000; // higher = slower approach to maxSpeed
      const currentRoadSpeed = maxSpeed - (maxSpeed - baseSpeed) * Math.exp(-state.score / speedRamp);

      const minSpawnInterval = 15;
      const maxSpawnInterval = 40;
      const spawnRamp = 4000;
      const spawnRate = Math.max(minSpawnInterval, minSpawnInterval + (maxSpawnInterval - minSpawnInterval) * Math.exp(-state.score / spawnRamp));

      state.frames++;
      if (!state.gameOver) state.score++;
      if (state.frames % 10 === 0 && !state.gameOver) setDisplayScore(Math.floor(state.score / 10));

      ctx.clearRect(0, 0, internalWidth, internalHeight);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(0, 0, internalWidth, internalHeight);

      if (!state.gameOver) { bgY += currentRoadSpeed; if (bgY >= internalHeight) bgY = 0; }

      // SAFE BACKGROUND DRAW
      if (imgBg.complete && imgBg.naturalWidth > 0) {
        ctx.drawImage(imgBg, 0, bgY, internalWidth, internalHeight);
        ctx.drawImage(imgBg, 0, bgY - internalHeight, internalWidth, internalHeight);
      } else {
        ctx.fillStyle = '#6b7280'; ctx.fillRect(57, 0, internalWidth - 114, internalHeight);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 0, 57, internalHeight); ctx.fillRect(internalWidth - 57, 0, 57, internalHeight);
      }

      const minX = 57; const maxX = internalWidth - 57 - carW;
      const playerX = minX + (playerPosRef.current / 100) * (maxX - minX);
      const playerY = internalHeight - carH - 100;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;

      if (state.frames % Math.round(spawnRate) === 0 && !state.gameOver) spawnEnemy();

      // --- Pass 1: movement + lane-change decisions ---
      if (!state.gameOver) {
        state.enemies.forEach((e) => {
          e.y += (currentRoadSpeed - e.relativeSpeed);

          if (!e.isTruck && e.y > 0 && e.y < internalHeight - 150 && !e.targetLane && Math.random() < 0.005) {
            const currentLaneIdx = getLaneIndexForX(e.x + e.width / 2);
            const nextLaneIdx = currentLaneIdx + (Math.random() > 0.5 ? 1 : -1);

            if (nextLaneIdx >= 0 && nextLaneIdx < lanes.length) {
              const potentialTargetLane = lanes[nextLaneIdx];

              const isSafeToSwitch = !state.enemies.some((other) => {
                if (other === e) return false;
                const otherLaneX = other.targetLane !== null ? other.targetLane : (other.x + other.width / 2);
                return Math.abs(otherLaneX - potentialTargetLane) < 20 && Math.abs(other.y - e.y) < 130;
              });

              // FIX: never let a lane change close off the player's last open lane
              const occupiedByOthers = getOccupiedLanes(e);
              const resultingOccupied = new Set(occupiedByOthers);
              resultingOccupied.add(nextLaneIdx);
              const keepsOneLaneFree = resultingOccupied.size < numLanes;

              if (isSafeToSwitch && keepsOneLaneFree) {
                e.targetLane = potentialTargetLane; e.blinking = true; e.blinkTimer = 45;
              }
            }
          }

          if (e.targetLane) {
            if (e.blinkTimer > 0) e.blinkTimer--;
            else {
              e.blinking = false; const targetX = e.targetLane - (e.width / 2); const switchSpeed = 0.6;
              if (e.x < targetX) e.x += switchSpeed; if (e.x > targetX) e.x -= switchSpeed;
              if (Math.abs(e.x - targetX) <= switchSpeed) { e.x = targetX; e.targetLane = null; }
            }
          }
        });

        // --- Pass 2: keep NPCs from overlapping / colliding with each other ---
        // Works for same-lane traffic AND mid lane-change overlaps, since it's based
        // on actual horizontal overlap rather than lane index.
        const minGapY = 14;
        const byY = [...state.enemies].sort((a, b) => a.y - b.y); // smallest y = furthest from player
        for (let i = 0; i < byY.length; i++) {
          for (let j = i + 1; j < byY.length; j++) {
            const behind = byY[i]; const ahead = byY[j];
            if (ahead.y <= behind.y) continue;
            const overlapsX = behind.x < ahead.x + ahead.width + 6 && behind.x + behind.width + 6 > ahead.x;
            if (overlapsX) {
              const maxBehindY = ahead.y - behind.height - minGapY;
              if (behind.y > maxBehindY) behind.y = maxBehindY;
            }
          }
        }
      }

      // --- Pass 3: draw + collision-with-player + cleanup ---
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];

        // SAFE ENEMY DRAW
        if (e.image.complete && e.image.naturalWidth > 0) {
          ctx.drawImage(e.image, e.x, e.y, e.width, e.height);
        } else {
          ctx.fillStyle = e.isTruck ? '#f1f5f9' : '#1e293b';
          ctx.fillRect(e.x, e.y, e.width, e.height);
        }

        if (e.blinking && state.frames % 10 < 5) {
          ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fbbf24';
          const blinkX = e.targetLane! < e.x + (e.width / 2) ? e.x : e.x + e.width - 4;
          ctx.fillRect(blinkX, e.y + e.height - 6, 4, 4); ctx.fillRect(blinkX, e.y + 2, 4, 4);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        }

        if (!state.gameOver && playerX + 2 < e.x + e.width - 2 && playerX + carW - 2 > e.x + 2 && playerY + 2 < e.y + e.height - 2 && playerY + carH - 2 > e.y + 2) {
          handleCrash();
        }

        if (e.y > internalHeight) state.enemies.splice(i, 1);
      }

      if (!state.gameOver) {
        // SAFE PLAYER DRAW
        if (imgCarMain.complete && imgCarMain.naturalWidth > 0) {
          ctx.drawImage(imgCarMain, playerX, playerY, carW, carH);
        } else {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(playerX, playerY, carW, carH);
        }

        ctx.shadowColor = 'transparent';
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.shadowColor = 'transparent';
        const frameW = 96; const frameH = 96;

        // SAFE EXPLOSION DRAW
        if (imgExplosion.complete && imgExplosion.naturalWidth > 0) {
          if (state.crashFrame < 12) {
            if (state.crashTimer % 4 === 0) state.crashFrame++;
            const drawX = playerX + (carW / 2) - (frameW / 2); const drawY = playerY + (carH / 2) - (frameH / 2);
            ctx.drawImage(imgExplosion, state.crashFrame * frameW, 0, frameW, frameH, drawX, drawY, frameW, frameH);
            state.crashTimer++;
            animationFrameId = requestAnimationFrame(render);
          } else {
            if (!state.gameOverSoundPlayed && isSoundOnRef.current && audioRefs.current.gameover) {
              state.gameOverSoundPlayed = true;
              audioRefs.current.gameover.currentTime = 0; audioRefs.current.gameover.play().catch(console.error);
            }
            const drawX = playerX + (carW / 2) - (frameW / 2); const drawY = playerY + (carH / 2) - (frameH / 2);
            ctx.drawImage(imgExplosion, 11 * frameW, 0, frameW, frameH, drawX, drawY, frameW, frameH);
          }
        }
      }
    };

    // FORCE RENDER TO START IMMEDIATELY
    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Try to play music immediately on first interaction
      if (isMusicOn && audioRefs.current.music) {
        audioRefs.current.music.volume = 0.1;
        audioRefs.current.music.play().catch(e => console.log('Audio blocked:', e));
      }
    }
  };
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    handleInteraction(); 
    // Set position and velocity for smooth slider interaction
    const newPos = Number(e.target.value);
    playerPosRef.current = newPos;
    playerVelocityRef.current = 0; // Stop momentum when slider is used
  };

  const submitScore = async (name: string, scoreToSubmit: number, totalFrames: number) => {
    setIsSubmitting(true);
    const finalName = name.trim() || `Guest_${Math.floor(Math.random() * 9999)}`;
    localStorage.setItem('traffic_playerName', finalName);
    setPlayerName(finalName);

    try {
      await fetch('/api/scores', {
        method: 'POST',
        body: JSON.stringify({ deviceId: getOrCreateDeviceId(), name: finalName, score: scoreToSubmit, frames: totalFrames }),
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await fetch('/api/scores');
      if (res.ok) setLeaderboard(await res.json());
    } catch (e) { console.error("Error submitting score", e); }

    setIsSubmitting(false);
    setShowNameModal(false);
  };

  const restart = () => {
    if (isSoundOn && audioRefs.current.button) { audioRefs.current.button.currentTime = 0; audioRefs.current.button.play().catch(console.error); }
    setTimeout(() => { window.location.reload(); }, 300);
  };

  // Prevent hydration UI mismatch errors by hiding UI until mounted
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#8b9bb4] flex items-center justify-center font-pixel overflow-hidden" onClick={handleInteraction} onTouchStart={handleInteraction}>
      <Link href="/" className="absolute top-4 left-4 z-50 bg-[#1e293b] text-white text-[10px] md:text-xs py-2 px-4 border-2 border-[#f8fafc] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-1">&larr; HUB</Link>

      {/* Balanced Flex Container: Spacer (Left) | Game (Center) | Leaderboard (Right) */}
      <div className="flex w-full h-full max-w-[1400px] items-center justify-center px-4">

        {/* INVISIBLE LEFT SPACER (Balances the layout so the game is perfectly centered) */}
        <div className="hidden lg:block flex-1" />

        {/* GAME CANVAS (CENTER) */}
        <div className="bg-[#f8fafc] p-2 sm:p-4 rounded border-[6px] border-[#334155] shadow-[12px_12px_0px_rgba(0,0,0,0.4)] h-[85vh] lg:h-[95vh] aspect-[1/2] max-h-[850px] flex flex-col items-center relative shrink-0 z-10">

          <div className="w-full bg-[#60a5fa] text-white p-2 mb-2 border-4 border-[#334155] flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] md:text-xs">
              <h1 className="font-bold text-shadow-sm tracking-wider">TRAFFIC RUN</h1>
              <div className="flex gap-2">
                <button onClick={() => setIsMusicOn(!isMusicOn)} className="relative w-8 h-8 bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center hover:bg-[#0f172a] transition-colors" title="Toggle Music">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="white" className={isMusicOn ? 'opacity-100' : 'opacity-40'}><rect x="3" y="10" width="4" height="4"/><rect x="9" y="8" width="4" height="4"/><rect x="6" y="2" width="2" height="10"/><rect x="12" y="2" width="2" height="8"/><rect x="6" y="2" width="8" height="2"/></svg>
                  {!isMusicOn && <div className="absolute w-10 border-b-2 border-red-500 rotate-45" />}
                </button>
                <button onClick={() => setIsSoundOn(!isSoundOn)} className="relative w-8 h-8 bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center hover:bg-[#0f172a] transition-colors" title="Toggle SFX">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="white" className={isSoundOn ? 'opacity-100' : 'opacity-40'}><rect x="2" y="6" width="4" height="4"/><polygon points="6,6 10,2 10,14 6,10" /><rect x="12" y="5" width="2" height="6"/><rect x="15" y="3" width="2" height="10"/></svg>
                  {!isSoundOn && <div className="absolute w-10 border-b-2 border-red-500 rotate-45" />}
                </button>
              </div>
            </div>
            <div className="w-full text-left text-[10px] px-1 text-[#1e293b] font-bold">SCORE: {displayScore}</div>
          </div>

          <div className="w-full flex-grow border-4 border-[#334155] bg-[#4ade80] relative overflow-hidden flex justify-center items-center">
            <canvas ref={canvasRef} width={301} height={602} className="h-full" style={{ imageRendering: 'pixelated', aspectRatio: '301/602' }} />

            {showNameModal && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-6 text-center">
                <h3 className="text-[#fbbf24] text-sm mb-4 font-bold">NEW HIGH SCORE!</h3>
                <input type="text" maxLength={10} placeholder="ENTER NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value.toUpperCase())} className="w-full bg-[#1e293b] text-white border-4 border-[#94a3b8] p-3 mb-4 text-center focus:outline-none" />
                <button disabled={isSubmitting} onClick={() => submitScore(playerName, Math.floor(gameStateRef.current.score / 10), gameStateRef.current.frames)} className="bg-[#4ade80] text-[#1e293b] w-full py-3 border-4 border-[#166534] hover:bg-[#22c55e] active:translate-y-1 mb-2 font-bold">
                  {isSubmitting ? 'SAVING...' : 'SAVE SCORE'}
                </button>
                <button onClick={() => setShowNameModal(false)} className="text-white text-[10px] underline">Skip</button>
              </div>
            )}

            {isGameOver && !showNameModal && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 p-4">
                <h2 className="text-white text-2xl mb-6 animate-bounce">CRASH!</h2>
                <button onClick={restart} className="bg-[#ef4444] text-white text-xs sm:text-sm py-4 px-8 border-4 border-[#7f1d1d] hover:bg-[#dc2626] active:translate-y-1 shadow-[4px_4px_0px_#7f1d1d]">TRY AGAIN</button>
              </div>
            )}
          </div>

          <div className="w-full mt-2 bg-[#f1f5f9] p-3 border-4 border-[#334155] shadow-inner">
            <input type="range" min="0" max="100" defaultValue="50" onChange={handleSliderChange} onPointerDown={handleInteraction} disabled={isGameOver} className="pixel-slider" />
          </div>
        </div>

        {/* LEADERBOARD (RIGHT) */}
        <div className="hidden lg:flex flex-1 justify-start pl-8">
          <div className="flex flex-col bg-[#f8fafc] p-4 rounded border-[6px] border-[#334155] shadow-[12px_12px_0px_rgba(0,0,0,0.4)] h-[80vh] max-h-[700px] w-full max-w-[320px]">
            <div className="bg-[#fbbf24] text-[#1e293b] p-3 mb-4 border-4 border-[#334155] text-center shadow-inner">
              <h2 className="font-bold text-sm tracking-widest">GLOBAL TOP 10</h2>
            </div>
            <div className="bg-[#1e293b] text-white p-3 mb-6 border-4 border-[#334155] text-xs text-center flex justify-between">
              <span>YOUR BEST:</span><span className="text-[#4ade80]">{personalBest}</span>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
              {leaderboard.length === 0 ? (
                <p className="text-center text-[#64748b] text-xs mt-10">NO SCORES YET</p>
              ) : (
                leaderboard.map((entry, idx) => {
                  const cleanName = entry.name.split('#')[0];
                  const isYou = !!playerName && cleanName.trim().toUpperCase() === playerName.trim().toUpperCase();
                  return (
                    <div key={idx} className={`flex justify-between items-center p-3 border-2 text-[10px] text-[#1e293b] ${isYou ? 'bg-[#fef9c3] border-[#fbbf24]' : 'bg-[#e2e8f0] border-[#94a3b8]'}`}>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#64748b]">#{idx + 1}</span>
                        <span>{cleanName}{isYou && <span className="text-[#16a34a] font-bold"> (You)</span>}</span>
                      </div>
                      <span className="font-bold">{entry.score}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}