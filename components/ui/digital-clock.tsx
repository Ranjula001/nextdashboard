'use client';

import { useEffect, useState } from 'react';

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-black text-green-400 font-mono text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg border border-green-500/30">
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        {formatTime(time).split('').map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-300 ${
              char === ':' ? 'animate-pulse' : ''
            }`}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}