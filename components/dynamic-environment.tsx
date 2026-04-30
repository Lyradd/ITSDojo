'use client';

import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/lib/store';
import { useTheme } from 'next-themes';

export function DynamicEnvironment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { streak } = useUserStore();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    
    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Determine current time
    const currentHour = new Date().getHours();
    
    // Check theme
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';

    // Particle Config
    const showSakura = false; // streak >= 3 && !isDark; // Tampilkan sakura HANYA di light mode agar tidak bentrok
    const showFireflies = false; // isDark; // Tampilkan kunang-kunang setiap kali Dark Mode aktif

    if (!showSakura && !showFireflies) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    /* 
    // Initialize particles
    if (showSakura) {
      for (let i = 0; i < 30; i++) {
        particles.push({
          type: 'sakura',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 5 + 5,
          speedY: Math.random() * 1 + 0.5,
          speedX: Math.random() * 2 - 1,
          angle: Math.random() * 360,
          spin: Math.random() * 2 - 1,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    }

    if (showFireflies) {
      for (let i = 0; i < 40; i++) {
        particles.push({
          type: 'firefly',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5,
          opacity: Math.random(),
          fadeSpeed: Math.random() * 0.02 + 0.01,
          fadingOut: Math.random() > 0.5
        });
      }
    }
    */

    const drawSakura = (p: any) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      
      // Draw petal
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-p.size, -p.size, -p.size, p.size, 0, p.size);
      ctx.bezierCurveTo(p.size, p.size, p.size, -p.size, 0, 0);
      ctx.fill();
      
      ctx.restore();

      // Update
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += p.spin;

      if (p.y > canvas.height) {
        p.y = -p.size;
        p.x = Math.random() * canvas.width;
      }
      if (p.x > canvas.width) p.x = 0;
      if (p.x < 0) p.x = canvas.width;
    };

    const drawFirefly = (p: any) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = '#eab308'; // Yellow
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fef08a';
      ctx.fill();
      
      ctx.restore();

      // Update
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Fade in/out
      if (p.fadingOut) {
        p.opacity -= p.fadeSpeed;
        if (p.opacity <= 0.1) p.fadingOut = false;
      } else {
        p.opacity += p.fadeSpeed;
        if (p.opacity >= 0.8) p.fadingOut = true;
      }

      // Wrap around
      if (p.x > canvas.width) p.x = 0;
      if (p.x < 0) p.x = canvas.width;
      if (p.y > canvas.height) p.y = 0;
      if (p.y < 0) p.y = canvas.height;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      /*
      particles.forEach((p) => {
        if (p.type === 'sakura') drawSakura(p);
        if (p.type === 'firefly') drawFirefly(p);
      });
      */

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [streak, theme, systemTheme, mounted]);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] mix-blend-screen"
      style={{ opacity: 0.8 }}
    />
  );
}
