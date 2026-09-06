import React, { useEffect, useRef, useState } from 'react';

/**
 * FlowerShower Component
 * Renders a festive, welcoming flower shower (throwing fresh rose, marigold/genda, and jasmine petals)
 * whenever a customer visits or opens the store.
 *
 * Uses high-performance HTML5 Canvas with realistic 3D fluttering physics,
 * air turbulence, and non-blocking pointer events.
 */
export function FlowerShower({ duration = 6000, initialCount = 130 }) {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palettes & types for authentic Indian flower shower / pushpa varsha
    const flowerTypes = [
      // 1. Velvet Rose Petal (Deep Crimson & Rose Red)
      {
        kind: 'petal',
        color1: '#e11d48',
        color2: '#9f1239',
        colorTip: '#f43f5e',
        baseRadius: 13,
        vein: 'rgba(255, 255, 255, 0.35)'
      },
      // 2. Pink Rose / Lotus Petal (Vibrant Magenta & Blush)
      {
        kind: 'petal',
        color1: '#ec4899',
        color2: '#be185d',
        colorTip: '#fbcfe8',
        baseRadius: 12,
        vein: 'rgba(255, 255, 255, 0.4)'
      },
      // 3. Fresh Marigold / Genda Phool Petal (Deep Saffron Orange)
      {
        kind: 'marigold_petal',
        color1: '#f97316',
        color2: '#c2410c',
        colorTip: '#fdba74',
        baseRadius: 14,
        vein: 'rgba(254, 240, 138, 0.45)'
      },
      // 4. Golden Marigold / Pitambari Petal (Warm Sunshine Yellow)
      {
        kind: 'marigold_petal',
        color1: '#eab308',
        color2: '#a16207',
        colorTip: '#fef08a',
        baseRadius: 13,
        vein: 'rgba(255, 255, 255, 0.5)'
      },
      // 5. Jasmine / Mogra 5-Petal Little Floret
      {
        kind: 'blossom_flower',
        color1: '#ffffff',
        color2: '#fef3c7',
        colorTip: '#f59e0b',
        baseRadius: 10,
        petals: 5
      },
      // 6. Hibiscus / Lotus Little Floret
      {
        kind: 'blossom_flower',
        color1: '#fb7185',
        color2: '#e11d48',
        colorTip: '#fef08a',
        baseRadius: 11,
        petals: 5
      }
    ];

    // Petal particle generator
    const createPetal = (isInitial = false) => {
      const type = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
      const isMobile = width < 640;
      const sizeMultiplier = isMobile ? 0.85 : 1.15;
      const radius = (Math.random() * 6 + type.baseRadius) * sizeMultiplier;

      // When starting, throw petals from the top arc (like being thrown by hand)
      const startX = isInitial
        ? width * 0.5 + (Math.random() - 0.5) * width * 1.1
        : Math.random() * width;
      
      const startY = isInitial
        ? (Math.random() - 0.5) * 80 - 40 // Near top edge
        : -40 - Math.random() * 100;

      // Initial throw burst velocity
      const throwSpeedX = (Math.random() - 0.5) * 4.0;
      const throwSpeedY = isInitial ? Math.random() * 2.2 + 2.0 : Math.random() * 1.8 + 1.6;

      return {
        x: startX,
        y: startY,
        size: radius,
        type: type,
        vx: throwSpeedX,
        vy: throwSpeedY,
        // Sway / Air resistance
        swaySpeed: Math.random() * 0.035 + 0.02,
        swayAmplitude: Math.random() * 3.2 + 1.5,
        swayOffset: Math.random() * Math.PI * 2,
        // 3D rotation angles & tumbling
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.06,
        rotSpeedY: (Math.random() - 0.5) * 0.08,
        rotSpeedZ: (Math.random() - 0.5) * 0.04,
        opacity: Math.random() * 0.15 + 0.85,
      };
    };

    const count = width < 640 ? Math.floor(initialCount * 0.6) : initialCount;
    const petals = [];

    // Create initial batch staggered in air and above
    for (let i = 0; i < count; i++) {
      const p = createPetal(true);
      p.y = (Math.random() * -height * 0.9) - 10; // Staggered upwards
      petals.push(p);
    }

    const startTime = performance.now();

    // Custom Petal Drawing Function
    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // 3D tumbling projection
      const scaleX = Math.cos(p.rotY);
      const scaleY = Math.cos(p.rotX);
      ctx.rotate(p.rotZ);
      ctx.scale(Math.abs(scaleX) < 0.08 ? 0.08 : scaleX, scaleY);

      ctx.globalAlpha = Math.max(0, p.opacity);

      const r = p.size;
      const t = p.type;

      if (t.kind === 'blossom_flower') {
        // Draw 5-Petal Blossom Flower
        ctx.fillStyle = t.color1;
        for (let a = 0; a < (t.petals || 5); a++) {
          ctx.save();
          ctx.rotate((a * (Math.PI * 2)) / (t.petals || 5));
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.68, r * 0.44, r * 0.68, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // Center Pollen/Stamen Core
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = t.colorTip;
        ctx.fill();
      } else if (t.kind === 'marigold_petal') {
        // Marigold ruffled petal
        const gradient = ctx.createLinearGradient(0, -r * 1.3, 0, r * 1.3);
        gradient.addColorStop(0, t.colorTip);
        gradient.addColorStop(0.35, t.color1);
        gradient.addColorStop(1, t.color2);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, -r * 1.3);
        ctx.bezierCurveTo(r * 0.7, -r * 0.9, r * 0.8, r * 0.4, r * 0.2, r * 1.3);
        ctx.bezierCurveTo(-r * 0.2, r * 1.3, -r * 0.8, r * 0.4, -r * 0.7, -r * 0.9);
        ctx.closePath();
        ctx.fill();

        // Vein
        ctx.strokeStyle = t.vein;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.0);
        ctx.quadraticCurveTo(r * 0.1, 0, 0, r * 1.0);
        ctx.stroke();
      } else {
        // Curved Organic Rose Petal
        const gradient = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r * 1.2);
        gradient.addColorStop(0, t.colorTip);
        gradient.addColorStop(0.4, t.color1);
        gradient.addColorStop(1, t.color2);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.1, -r * 0.7, r * 0.95, r * 0.8, 0, r * 1.2);
        ctx.bezierCurveTo(-r * 0.95, r * 0.8, -r * 1.1, -r * 0.7, 0, -r * 1.2);
        ctx.closePath();
        ctx.fill();

        // Subtle Rose Vein
        ctx.strokeStyle = t.vein;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.9);
        ctx.quadraticCurveTo(r * 0.12, 0, 0, r * 0.9);
        ctx.stroke();
      }

      ctx.restore();
    };

    const render = (currentTime) => {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      // Graceful fade-out during the last 1.5 seconds
      let globalFade = 1;
      const fadeStartTime = duration - 1500;
      if (elapsed > fadeStartTime) {
        globalFade = Math.max(0, 1 - (elapsed - fadeStartTime) / 1500);
      }

      let visiblePetals = 0;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Physics: air resistance + natural drift
        p.swayOffset += p.swaySpeed;
        p.x += p.vx + Math.sin(p.swayOffset) * p.swayAmplitude;
        p.y += p.vy;

        // Air damping on lateral throw speed
        p.vx *= 0.992;

        // 3D rotations
        p.rotX += p.rotSpeedX;
        p.rotY += p.rotSpeedY;
        p.rotZ += p.rotSpeedZ;

        p.opacity = (Math.sin(p.swayOffset) * 0.12 + 0.88) * globalFade;

        // Draw active petals
        if (p.y < height + 60 && p.opacity > 0.01) {
          drawPetal(p);
          visiblePetals++;
        }
      }

      if (elapsed < duration && visiblePetals > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setIsActive(false);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Global hook for triggering flower shower anytime
    window.triggerFlowerShower = () => {
      setIsActive(true);
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [duration, initialCount]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
