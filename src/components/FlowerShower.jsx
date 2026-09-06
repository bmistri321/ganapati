import React, { useEffect, useRef, useState } from 'react';

/**
 * FlowerShower Component
 * Renders a welcoming, auspicious flower shower (Rose petals, Marigold/Genda phool, Jasmine blossoms)
 * when a visitor opens the website.
 *
 * Uses a lightweight, high-performance HTML5 Canvas with realistic 3D fluttering physics
 * and non-blocking pointer events.
 */
export function FlowerShower({ duration = 5500, petalCount = 75 }) {
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

    // Color palettes for authentic auspicious floral shower
    // Rose petals, Marigold (Genda), Lotus pink, and Jasmine/Mogra
    const petalTypes = [
      {
        type: 'rose_red',
        color1: '#dc2626',
        color2: '#991b1b',
        colorTip: '#f87171',
        aspect: 1.3
      },
      {
        type: 'rose_pink',
        color1: '#f43f5e',
        color2: '#be123c',
        colorTip: '#fbcfe8',
        aspect: 1.25
      },
      {
        type: 'marigold_orange',
        color1: '#f97316',
        color2: '#c2410c',
        colorTip: '#fde047',
        aspect: 1.4
      },
      {
        type: 'marigold_gold',
        color1: '#eab308',
        color2: '#ca8a04',
        colorTip: '#fef08a',
        aspect: 1.35
      },
      {
        type: 'jasmine_white',
        color1: '#ffffff',
        color2: '#fef9c3',
        colorTip: '#fef08a',
        aspect: 1.1
      },
      {
        type: 'blossom_flower',
        color1: '#fb7185',
        color2: '#e11d48',
        colorTip: '#fef08a',
        aspect: 1.0,
        isFullFlower: true
      }
    ];

    // Initialize petals
    const petals = [];
    const count = Math.min(petalCount, width < 640 ? 45 : 85);

    for (let i = 0; i < count; i++) {
      const pType = petalTypes[Math.floor(Math.random() * petalTypes.length)];
      petals.push({
        x: Math.random() * width,
        y: Math.random() * -height * 0.8 - 20, // Start staggered above viewport
        size: Math.random() * 8 + (width < 640 ? 8 : 11),
        type: pType,
        // Velocities
        vx: (Math.random() - 0.5) * 2.2 + (Math.random() > 0.5 ? 0.6 : -0.6),
        vy: Math.random() * 1.8 + 1.6,
        // Oscillations & Flutter (sway in air)
        swaySpeed: Math.random() * 0.04 + 0.02,
        swayAmplitude: Math.random() * 2.5 + 1.2,
        swayOffset: Math.random() * Math.PI * 2,
        // 3D rotation angles
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.05,
        rotSpeedY: (Math.random() - 0.5) * 0.06,
        rotSpeedZ: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.25 + 0.75,
      });
    }

    const startTime = performance.now();

    // Custom Petal Drawing Function
    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Simulate 3D tumbling via matrix transformations
      const scaleX = Math.cos(p.rotY);
      const scaleY = Math.cos(p.rotX);
      ctx.rotate(p.rotZ);
      ctx.scale(scaleX, scaleY);

      ctx.globalAlpha = Math.max(0, p.opacity);

      const r = p.size;

      if (p.type.isFullFlower) {
        // Draw 5-Petal Jasmine/Blossom Flower
        ctx.fillStyle = p.type.color1;
        for (let a = 0; a < 5; a++) {
          ctx.save();
          ctx.rotate((a * (Math.PI * 2)) / 5);
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.65, r * 0.45, r * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // Golden Center
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = p.type.colorTip;
        ctx.fill();
      } else {
        // Draw Curved Organic Petal (Rose / Marigold petal)
        const gradient = ctx.createLinearGradient(0, -r, 0, r);
        gradient.addColorStop(0, p.type.colorTip);
        gradient.addColorStop(0.4, p.type.color1);
        gradient.addColorStop(1, p.type.color2);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        // Teardrop curved organic petal path
        ctx.moveTo(0, -r * 1.1);
        ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.8, r * 0.7, 0, r * 1.1);
        ctx.bezierCurveTo(-r * 0.8, r * 0.7, -r * 0.9, -r * 0.6, 0, -r * 1.1);
        ctx.closePath();
        ctx.fill();

        // Subtle center vein highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.8);
        ctx.quadraticCurveTo(r * 0.1, 0, 0, r * 0.8);
        ctx.stroke();
      }

      ctx.restore();
    };

    let isDone = false;

    const render = (currentTime) => {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      // Global fade-out during the last 1.2 seconds of animation
      let globalFade = 1;
      const fadeStartTime = duration - 1200;
      if (elapsed > fadeStartTime) {
        globalFade = Math.max(0, 1 - (elapsed - fadeStartTime) / 1200);
      }

      let visiblePetals = 0;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Physics updates
        p.swayOffset += p.swaySpeed;
        p.x += p.vx + Math.sin(p.swayOffset) * p.swayAmplitude;
        p.y += p.vy;

        // 3D rotation update
        p.rotX += p.rotSpeedX;
        p.rotY += p.rotSpeedY;
        p.rotZ += p.rotSpeedZ;

        // Apply fade-out factor
        p.opacity = (Math.sin(p.swayOffset) * 0.15 + 0.85) * globalFade;

        // Only draw if petal is within or near visible screen area
        if (p.y < height + 50 && p.opacity > 0.01) {
          drawPetal(p);
          visiblePetals++;
        }
      }

      if (elapsed < duration && visiblePetals > 0 && !isDone) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setIsActive(false);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Global helper so it can be re-triggered anytime if desired
    window.triggerFlowerShower = () => {
      setIsActive(true);
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [duration, petalCount]);

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
