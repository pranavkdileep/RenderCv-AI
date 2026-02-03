import { useEffect, useRef } from 'react';

export default function GalaxyAILoader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Optional: slight random delay for each particle so they don't all move together
    const particles = container.querySelectorAll('.particle');
    particles.forEach((p, i) => {
      const el = p as HTMLElement;
      el.style.animationDelay = `${Math.random() * 1.2}s`;
      el.style.transform = `rotate(${Math.random() * 360}deg) translateX(${80 + Math.random() * 40}px)`;
    });
  }, []);

  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {/* Main glowing core */}
      <div className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 opacity-70 blur-xl animate-pulse-slow"></div>
      
      {/* Stronger inner glow */}
      <div className="absolute h-20 w-20 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 shadow-[0_0_40px_8px] shadow-purple-600/60 animate-pulse-fast"></div>

      {/* Very bright center */}
      <div className="absolute h-12 w-12 rounded-full bg-white/90 shadow-[0_0_35px_10px] shadow-cyan-300/70 z-10"></div>

      {/* Orbiting particles */}
      <div ref={containerRef} className="absolute h-full w-full">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_12px_2px] shadow-cyan-200 animate-orbit"
            style={{
              animationDuration: `${3.5 + Math.random() * 2.5}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }}
          />
        ))}
      </div>

      {/* Optional orbiting ring */}
      <div className="absolute h-[140px] w-[140px] rounded-full border border-purple-400/30 animate-rotate-slow">
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-purple-300 shadow-lg shadow-purple-400/60"></div>
      </div>

      
    </div>
  );
}

