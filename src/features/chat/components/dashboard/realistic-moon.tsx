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
  const radius = 100; // Internal SVG coordinate system radius
  const center = 100;
  const prefersReducedMotion = useReducedMotion();

  // Determine waxing vs waning based on cycle position
  const isWaxing = phase.fraction <= 0.5;
  const illumFraction = phase.illumination / 100;

  // Calculate the SVG path for the lit portion of the moon
  const litPath = useMemo(() => {
    const { fraction, illumination } = phase;
    const p = fraction; // 0..1 position in lunar cycle
    const illumFrac = illumination / 100; // Convert percentage to 0..1

    // Determine waxing vs waning based on cycle position
    const waxing = p <= 0.5;

    // Calculate terminator position based on actual illumination
    // illumination follows: 0% (new) -> 50% (quarter) -> 100% (full)
    // Map to terminator x-position: -radius (full) to +radius (new)
    // For 50% illumination (quarter), terminator should be at x=0 (center)
    const terminatorX = radius * (1 - 2 * illumFrac);

    // Construct Path
    // M 100 0 (Top)
    // If Waxing:
    //   Arc to Bottom via Right side (outer rim): A 100 100 0 0 1 100 200
    //   Arc back to Top via Terminator: A [rx] 100 0 0 [sweep] 100 0

    // Terminator Sweep logic:
    // If we are Waxing Crescent (0 < p < 0.25), terminator curves Right (matches outer).
    // If Waxing Gibbous (0.25 < p < 0.5), terminator curves Left (bulges out).

    // Actually, a single Elliptical Arc command is tricky with changing radii sign.
    // Better to use Bezier or just absolute coordinates if we want perfect control,
    // but SVG arc `A rx ry x-axis-rotation large-arc-flag sweep-flag x y` works well.

    const rx = Math.abs(terminatorX);
    // Wait, logic check:
    // Waxing (Right side lit):
    //   Outer: Top -> Right -> Bottom.
    //   Inner (Terminator): Bottom -> Top.
    //   If Crescent (p<0.25): Terminator curves Right (inwards). Sweep 0?
    //   If Gibbous (p>0.25): Terminator curves Left (bulges out). Sweep 1?

    // Waning (Left side lit):
    //   Outer: Bottom -> Left -> Top.
    //   Inner (Terminator): Top -> Bottom.

    if (waxing) {
      // Waxing: Lit on Right
      // Path: Top -> (Outer Right) -> Bottom -> (Terminator) -> Top
      const outerSweep = 1;
      const termSweep = p < 0.25 ? 0 : 1;
      return `M ${center} 0 
              A ${radius} ${radius} 0 0 ${outerSweep} ${center} ${center * 2}
              A ${rx} ${radius} 0 0 ${termSweep} ${center} 0`;
    } else {
      // Waning: Lit on Left
      // Path: Bottom -> (Outer Left) -> Top -> (Terminator) -> Bottom
      const outerSweep = 1; // Clockwise from Bottom to Top via Left? No.
      // SVG Arcs:
      // Center (100,100).
      // Bottom (100, 200) to Top (100, 0).
      // If we go clockwise, we go via Left. So sweep=1.

      const termSweep = p < 0.75 ? 0 : 1;
      // If Gibbous (0.5 < p < 0.75): Terminator curves Right (bulges out). Sweep 0?
      // If Crescent (p > 0.75): Terminator curves Left (inwards). Sweep 1?

      return `M ${center} ${center * 2}
              A ${radius} ${radius} 0 0 ${outerSweep} ${center} 0
              A ${rx} ${radius} 0 0 ${termSweep} ${center} ${center * 2}`;
    }
  }, [phase.fraction, phase.illumination]);

  // Generate random star positions (deterministic based on phase for consistency)
  const stars = useMemo(() => {
    const starCount = 12;
    const seed = Math.floor(phase.fraction * 1000);
    return Array.from({ length: starCount }, (_, i) => {
      // Pseudo-random but consistent positions
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

  // Animation variants based on reduced motion preference
  const breathingAnimation = prefersReducedMotion
    ? {}
    : {
        scale: [1, 1.02, 1],
        opacity: [0.9, 1, 0.9],
      };

  return (
    <motion.div
      className={`group relative cursor-default ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${phase.name} at ${phase.illumination}% illumination`}
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Atmospheric Starfield - subtle background stars */}
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

      {/* Multi-layer Atmospheric Glow - silvery white moonlight */}
      {/* Outer halo - soft silver glow */}
      <div
        className="absolute inset-0 rounded-full bg-radial from-slate-200/30 via-slate-300/15 to-transparent blur-2xl"
        style={{
          transform: `scale(1.15) translateX(${isWaxing ? 10 : -10}%)`,
          opacity: 0.4 + illumFraction * 0.3,
        }}
      />

      {/* Middle halo - silver moonlight glow */}
      <div
        className="absolute inset-0 rounded-full bg-radial from-white/30 via-slate-100/15 to-transparent blur-xl"
        style={{
          transform: `scale(1.08) translateX(${isWaxing ? 8 : -8}%)`,
          opacity: 0.5 + illumFraction * 0.3,
        }}
      />

      {/* Inner glow - bright white core */}
      <div
        className="absolute inset-0 rounded-full bg-radial from-white/40 via-slate-50/15 to-transparent blur-lg"
        style={{
          transform: `scale(1.02) translateX(${isWaxing ? 5 : -5}%)`,
          opacity: 0.5 + illumFraction * 0.4,
        }}
      />

      {/* Subtle rim light that intensifies on hover */}
      <motion.div
        className="absolute inset-0 rounded-full bg-linear-to-br from-white/0 via-white/5 to-white/0 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
        style={{
          transform: 'scale(0.95)',
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        animate={breathingAnimation}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: [0.37, 0, 0.63, 1], // Gentle breathing ease
        }}
      >
        <defs>
          {/* Soft edge filter for anti-aliasing */}
          <filter id="soften" x="-2%" y="-2%" width="104%" height="104%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          </filter>

          {/* Mask for full moon with soft edge */}
          <mask id="moon-mask">
            <circle cx="100" cy="100" r="99" fill="white" filter="url(#soften)" />
          </mask>

          {/* Mask for lit portion with soft edge */}
          <mask id="lit-mask">
            <path d={litPath} fill="white" filter="url(#soften)" />
          </mask>

          {/* Enhanced Radial Gradient - bright silvery moonlight */}
          <radialGradient id="moon-sphere" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="25%" stopColor="#f1f5f9" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="60%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="85%" stopColor="#64748b" />
            <stop offset="95%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>

          {/* Highlight accent - subtle top-left accent for extra 3D pop */}
          <radialGradient id="highlight-accent" cx="30%" cy="30%" r="40%">
            <stop offset="0%" stopColor="currentColor" className="text-white/20" />
            <stop offset="50%" stopColor="currentColor" className="text-white/5" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Limb darkening - realistic edge falloff for 3D depth */}
          <radialGradient id="limb-darkening" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="transparent" />
            <stop offset="80%" stopColor="currentColor" className="text-black/5" />
            <stop offset="90%" stopColor="currentColor" className="text-black/15" />
            <stop offset="100%" stopColor="currentColor" className="text-black/40" />
          </radialGradient>

          {/* Terminator shadow - soft gradient at the light/dark boundary */}
          <linearGradient
            id="terminator-shadow"
            x1={isWaxing ? '0%' : '100%'}
            y1="50%"
            x2={isWaxing ? '100%' : '0%'}
            y2="50%"
          >
            <stop offset="0%" stopColor="transparent" />
            <stop offset={`${Math.max(20, illumFraction * 80)}%`} stopColor="transparent" />
            <stop
              offset={`${Math.min(95, illumFraction * 100 + 15)}%`}
              stopColor="currentColor"
              className="text-black/30"
            />
            <stop offset="100%" stopColor="currentColor" className="text-black/50" />
          </linearGradient>
        </defs>

        {/* 1. Dark Moon Base */}
        <circle cx="100" cy="100" r="100" fill="#0a0a0a" />

        {/* 2. Full Moon Texture - very faint on dark side (earthshine effect) */}
        <g mask="url(#moon-mask)" style={{ filter: 'saturate(0.3)' }}>
          <image
            href="/moon-texture.jpg"
            x="-100"
            y="0"
            width="400"
            height="200"
            preserveAspectRatio="xMidYMid slice"
            className="opacity-10"
          />
        </g>

        {/* 3. Lit portion texture */}
        <g mask="url(#lit-mask)" style={{ filter: 'brightness(1.0) saturate(0.85)' }}>
          <image
            href="/moon-texture.jpg"
            x="-100"
            y="0"
            width="400"
            height="200"
            preserveAspectRatio="xMidYMid slice"
            className="opacity-90"
          />
        </g>

        {/* 4. Subtle silvery overlay on lit portion */}
        <path d={litPath} fill="#e2e8f0" className="opacity-10" />

        {/* 5. Lit Portion gradient overlay - adds 3D depth to texture */}
        <path d={litPath} fill="url(#moon-sphere)" className="opacity-25 mix-blend-overlay" />

        {/* 6. Terminator shadow - soft falloff at light/dark boundary */}
        <g mask="url(#lit-mask)">
          <circle
            cx="100"
            cy="100"
            r="100"
            fill="url(#terminator-shadow)"
            className="pointer-events-none"
          />
        </g>

        {/* 7. Highlight accent on lit portion - extra 3D pop */}
        <path d={litPath} fill="url(#highlight-accent)" className="pointer-events-none" />

        {/* 8. Limb darkening overlay - realistic edge falloff */}
        <circle
          cx="100"
          cy="100"
          r="100"
          fill="url(#limb-darkening)"
          className="pointer-events-none"
        />
      </motion.svg>
    </motion.div>
  );
}
