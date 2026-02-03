'use client';

import { useEffect, useState } from 'react';

export function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds() * 6; // 360/60
  const minutes = time.getMinutes() * 6 + seconds / 60; // 360/60 + smooth movement
  const hours = (time.getHours() % 12) * 30 + minutes / 12; // 360/12 + smooth movement

  return (
    <div className="relative w-32 h-32 bg-white rounded-full shadow-lg border-4 border-slate-200">
      {/* Clock face */}
      <div className="absolute inset-2 rounded-full border border-slate-100">
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-4 bg-slate-400"
            style={{
              top: '4px',
              left: '50%',
              transformOrigin: '50% 56px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          />
        ))}
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30" />
        
        {/* Hour hand */}
        <div
          className="absolute w-1 bg-slate-800 rounded-full origin-bottom z-20"
          style={{
            height: '32px',
            top: '32px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translateX(-50%) rotate(${hours}deg)`,
          }}
        />
        
        {/* Minute hand */}
        <div
          className="absolute w-0.5 bg-slate-600 rounded-full origin-bottom z-20"
          style={{
            height: '44px',
            top: '20px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translateX(-50%) rotate(${minutes}deg)`,
          }}
        />
        
        {/* Second hand */}
        <div
          className="absolute w-px bg-red-500 rounded-full origin-bottom z-20"
          style={{
            height: '48px',
            top: '16px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translateX(-50%) rotate(${seconds}deg)`,
          }}
        />
      </div>
      
      {/* Digital time display */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded shadow">
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>
    </div>
  );
}