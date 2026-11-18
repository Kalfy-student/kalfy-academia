import { useEffect, useRef } from 'react';

interface GalaxyBackgroundProps {
  theme: 'dark' | 'light';
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  depth: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function GalaxyBackground({ theme }: GalaxyBackgroundProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    if (!canvas || !layer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const darkColors = ['#F8FAFC', '#10B981', '#06B6D4', '#A7F3D0', '#F59E0B'];
    const lightColors = ['#059669', '#0284C7', '#0F172A', '#10B981'];
    const palette = theme === 'dark' ? darkColors : lightColors;

    const starCount = Math.min(130, Math.max(70, Math.floor((width * height) / 14000)));
    const stars: StarParticle[] = Array.from({ length: starCount }, () => {
      const depth = 0.25 + Math.random() * 0.85;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: depth > 0.8 ? 3 : depth > 0.5 ? 2 : 1.5,
        depth,
        alpha: 0.35 + Math.random() * 0.6,
        twinkleSpeed: 0.015 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.14 * depth,
        vy: (-0.08 - Math.random() * 0.18) * depth,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    });

    const shootingStars: ShootingStar[] = [];
    let frameId = 0;
    let tick = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, width) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, height) - 0.5) * 2;
      targetMouseX = nx;
      targetMouseY = ny;
    };

    window.addEventListener('resize', handleResize);
    if (!reducedMotion) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    const render = () => {
      tick += 1;

      // Smoothly interpolate mouse offset for silky galaxy parallax
      currentMouseX += (targetMouseX - currentMouseX) * 0.06;
      currentMouseY += (targetMouseY - currentMouseY) * 0.06;

      if (!reducedMotion) {
        const bgOffsetX = -currentMouseX * 22;
        const bgOffsetY = -currentMouseY * 16;
        layer.style.transform = `translate3d(${bgOffsetX.toFixed(2)}px, ${bgOffsetY.toFixed(2)}px, 0) scale(1.08)`;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw pixel-art stars with cursor parallax & gentle drift
      for (const star of stars) {
        if (!reducedMotion) {
          star.x += star.vx;
          star.y += star.vy;
          star.twinklePhase += star.twinkleSpeed;

          if (star.y < -10) star.y = height + 10;
          if (star.x < -10) star.x = width + 10;
          if (star.x > width + 10) star.x = -10;
        }

        const parallaxX = -currentMouseX * 36 * star.depth;
        const parallaxY = -currentMouseY * 26 * star.depth;
        const drawX = Math.round(star.x + parallaxX);
        const drawY = Math.round(star.y + parallaxY);
        const twinkle = 0.55 + 0.45 * Math.sin(star.twinklePhase);
        const finalAlpha = Math.max(0.12, Math.min(1, star.alpha * twinkle));

        ctx.globalAlpha = theme === 'dark' ? finalAlpha : finalAlpha * 0.45;
        ctx.fillStyle = star.color;

        // Crisp square pixel-art star + subtle cross glint on bright stars
        ctx.fillRect(drawX, drawY, star.size, star.size);
        if (star.size >= 3 && twinkle > 0.82) {
          ctx.fillRect(drawX - 2, drawY + 1, 1, 1);
          ctx.fillRect(drawX + 4, drawY + 1, 1, 1);
          ctx.fillRect(drawX + 1, drawY - 2, 1, 1);
          ctx.fillRect(drawX + 1, drawY + 4, 1, 1);
        }
      }

      // Occasional subtle shooting pixel star
      if (!reducedMotion && tick % 190 === 0 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width * 0.7,
          y: Math.random() * height * 0.4,
          vx: 7 + Math.random() * 4,
          vy: 3 + Math.random() * 2,
          life: 0,
          maxLife: 38,
          color: theme === 'dark' ? '#6EE7B7' : '#059669'
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;

        const progress = 1 - s.life / s.maxLife;
        ctx.globalAlpha = Math.max(0, progress * (theme === 'dark' ? 0.85 : 0.4));
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 3.5, s.y - s.vy * 3.5);
        ctx.stroke();

        if (s.life >= s.maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [theme]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Mouse-reactive Pixel-Art Galaxy Artwork Layer */}
      <div
        ref={layerRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform opacity-42 dark:opacity-62 transition-opacity duration-300"
        style={{
          backgroundImage: "url('/assets/sprites/galaxy-wide.jpg')",
          transform: 'translate3d(0, 0, 0) scale(1.08)'
        }}
      />

      {/* Contrast Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7FA]/86 via-[#F4F7FA]/76 to-[#F4F7FA]/95 dark:from-[#05080D]/72 dark:via-[#05080D]/58 dark:to-[#05080D]/92" />

      {/* Animated Pixel Starfield & Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
