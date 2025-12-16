'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type MoonPhaseData } from '@/lib/astronomy/moon';

interface RealisticMoonProps {
  phase: MoonPhaseData;
  size?: number;
  className?: string;
}

export function RealisticMoon({ phase, size = 200, className = '' }: RealisticMoonProps) {
  const radius = 100;
  const center = 100;
  const prefersReducedMotion = useReducedMotion();

  const isWaxing = phase.fraction <= 0.5;
  const illumFraction = phase.illumination / 100;

  // Calculate the SVG path for the lit portion
  const litPath = useMemo(() => {
    const { fraction, illumination } = phase;
    const p = fraction;
    const illumFrac = illumination / 100;
    const waxing = p <= 0.5;
    const terminatorX = radius * (1 - 2 * illumFrac);
    const rx = Math.abs(terminatorX);

    if (waxing) {
      const outerSweep = 1;
      const termSweep = p < 0.25 ? 0 : 1;
      return `M ${center} 0 
              A ${radius} ${radius} 0 0 ${outerSweep} ${center} ${center * 2}
              A ${rx} ${radius} 0 0 ${termSweep} ${center} 0`;
    } else {
      const outerSweep = 1;
      const termSweep = p < 0.75 ? 1 : 0;
      return `M ${center} ${center * 2}
              A ${radius} ${radius} 0 0 ${outerSweep} ${center} 0
              A ${rx} ${radius} 0 0 ${termSweep} ${center} ${center * 2}`;
    }
  }, [phase.fraction, phase.illumination]);

  // Stars for atmosphere
  const stars = useMemo(() => {
    const starCount = 12;
    const seed = Math.floor(phase.fraction * 1000);
    return Array.from({ length: starCount }, (_, i) => {
      const angle = ((seed + i * 137.508) % 360) * (Math.PI / 180);
      const distance = 70 + ((seed + i * 43) % 25);
      return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
        size: 0.8 + ((seed + i * 17) % 10) / 10,
        delay: i * 0.3,
      };
    });
  }, [phase.fraction]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${phase.name} at ${phase.illumination}% illumination`}
    >
      {/* Background stars */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0" style={{ width: size, height: size }}>
          {stars.map((star, i) => (
            <motion.div
              key={i}
              className="bg-primary/30 absolute rounded-full"
              style={{
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + star.delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: star.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Moon with hover effect */}
      <div
        className="relative z-10"
        style={{
          transform: 'scale(1)',
          transition: 'transform 0.3s ease-out',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!prefersReducedMotion) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Circular clip for moon */}
            <clipPath id="moon-clip">
              <circle cx="100" cy="100" r="100" />
            </clipPath>

            {/* Clip for lit portion */}
            <clipPath id="lit-clip">
              <path d={litPath} />
            </clipPath>

            {/* Soft terminator gradient */}
            <linearGradient
              id="terminator-fade"
              x1={isWaxing ? '40%' : '60%'}
              y1="50%"
              x2={isWaxing ? '60%' : '40%'}
              y2="50%"
            >
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
            </linearGradient>
          </defs>

          {/* Base: Full moon texture clipped to circle */}
          <g clipPath="url(#moon-clip)">
            {/* Full texture as base - slightly visible for earthshine */}
            <image
              href="/moon-texture-hq.jpg"
              x="-100"
              y="0"
              width="400"
              height="200"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.15"
            />

            {/* Lit portion - full brightness */}
            <g clipPath="url(#lit-clip)">
              <image
                href="/moon-texture-hq.jpg"
                x="-100"
                y="0"
                width="400"
                height="200"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Terminator shadow for soft edge */}
            <circle
              cx="100"
              cy="100"
              r="100"
              fill="url(#terminator-fade)"
              opacity={0.5 + illumFraction * 0.3}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
