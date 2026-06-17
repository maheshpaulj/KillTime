'use client';
import { useEffect, useRef } from 'react';

export default function KillTimeLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // We use a ref to track state so the animation loop reads it instantly without re-rendering
  const animState = useRef({
    status: 'idle', // 'idle' | 'sword' | 'bomb' | 'dead'
    frame: 0,
    timer: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    // --- SPRITE CONFIGURATION ---
    // Update the 'frames' values below to match the exact number of frames in your images!
    const config = {
      idle:  { src: '/sprites/kill-time/clock.png', frames: 8 },      // Adjust frames if not 10
      sword: { src: '/sprites/kill-time/sword_kill.png', frames: 6 },  // Adjust frames if not 7
      bomb:  { src: '/sprites/kill-time/bomb_kill.png', frames: 6 },   // Adjust frames if not 5
    };

    // Preload Images
    const images: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    
    Object.entries(config).forEach(([key, data]) => {
      const img = new Image();
      img.src = data.src;
      img.onload = () => {
        loadedCount++;
        // Start loop only when all 3 images are loaded
        if (loadedCount === 3) requestAnimationFrame(render);
      };
      images[key] = img;
    });

    let animationId: number;

    const render = () => {
      const state = animState.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let currentImg = images.idle;
      let frameCount = config.idle.frames;
      let animSpeed = 10; // Lower is faster

      // Determine which sprite to draw based on state
      if (state.status === 'sword') {
        currentImg = images.sword;
        frameCount = config.sword.frames;
        animSpeed = 10;
      } else if (state.status === 'bomb') {
        currentImg = images.bomb;
        frameCount = config.bomb.frames;
        animSpeed = 10;
      } else if (state.status === 'dead') {
        // If dead, we just draw the final frame of whatever killed it
        currentImg = images.sword; // Default fallback, but we actually stop the frame counter before it hits 'dead'
        frameCount = config.sword.frames; // This won't animate, but we need it for the source slice dimensions
      }

      // Calculate slice dimensions dynamically based on image width and frame count
      const sourceW = currentImg.width / frameCount;
      const sourceH = currentImg.height;

      // Draw the current frame, centered in the canvas
      const drawX = (canvas.width / 2) - (sourceW / 2);
      const drawY = (canvas.height / 2) - (sourceH / 2);

      ctx.drawImage(
        currentImg,
        state.frame * sourceW, 0, sourceW, sourceH, // Source slice
        drawX, drawY, sourceW, sourceH              // Destination canvas
      );

      // Advance frames
      if (state.status !== 'dead') {
        state.timer++;
        if (state.timer % animSpeed === 0) {
          state.frame++;
          
          // Loop idle, but stop kill animations on the last frame
          if (state.frame >= frameCount) {
            if (state.status === 'idle') {
              state.frame = 0; // Loop the rotation
            } else {
              state.frame = frameCount - 1; // Freeze on the final ruined frame
              state.status = 'dead';
            }
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleClick = () => {
    // Only trigger if it hasn't been killed yet
    if (animState.current.status === 'idle') {
      animState.current.status = Math.random() > 0.5 ? 'sword' : 'bomb';
      animState.current.frame = 0;
      animState.current.timer = 0;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      // Fixed size for the logo wrapper, scaling handled by CSS
      width={200}
      height={200}
      onClick={handleClick}
      className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-transform ${
        animState.current.status === 'idle' ? 'cursor-pointer hover:scale-110' : 'cursor-default'
      }`}
      title={animState.current.status === 'idle' ? 'Kill Time!' : ''}
    />
  );
}