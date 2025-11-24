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

  // Calculate the SVG path for the lit portion of the moon
  const litPath = useMemo(() => {
    const { fraction, illumination } = phase;
    const p = fraction; // 0..1 position in lunar cycle
    const illumFraction = illumination / 100; // Convert percentage to 0..1

    // Determine waxing vs waning based on cycle position
    const isWaxing = p <= 0.5;

    // Calculate terminator position based on actual illumination
    // illumination follows: 0% (new) -> 50% (quarter) -> 100% (full)
    // Map to terminator x-position: -radius (full) to +radius (new)
    // For 50% illumination (quarter), terminator should be at x=0 (center)
    const terminatorX = radius * (1 - 2 * illumFraction);

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

    if (isWaxing) {
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
  const glowAnimation = prefersReducedMotion
    ? {}
    : {
        scale: [1, 1.08, 1],
        opacity: [0.4, 0.6, 0.4],
      };

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

      {/* Multi-layer Atmospheric Glow - creates depth and therapeutic calm */}
      {/* Outer halo - softest, widest glow */}
      <motion.div
        className="from-primary/15 via-accent/10 absolute inset-0 rounded-full bg-linear-to-br to-transparent blur-3xl"
        style={{
          transform: 'scale(1.3)',
        }}
        animate={glowAnimation}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95], // Therapeutic breathing curve
        }}
      />

      {/* Middle halo - medium intensity */}
      <motion.div
        className="from-primary/20 via-therapy-info/15 absolute inset-0 rounded-full bg-linear-to-br to-transparent blur-2xl"
        style={{
          transform: 'scale(1.15)',
        }}
        animate={glowAnimation}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
          delay: 0.5,
        }}
      />

      {/* Inner glow - strongest, tightest */}
      <motion.div
        className="from-accent/25 via-primary/20 absolute inset-0 rounded-full bg-linear-to-br to-transparent blur-xl"
        animate={glowAnimation}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
          delay: 1,
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
          {/* Enhanced Crater Pattern - multiple layers for depth */}
          <pattern id="craters" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            {/* Large craters */}
            <circle cx="25" cy="25" r="10" fill="currentColor" className="text-black/8" />
            <circle cx="25" cy="25" r="8" fill="currentColor" className="text-black/4" />

            {/* Medium craters */}
            <circle cx="12" cy="12" r="4" fill="currentColor" className="text-black/6" />
            <circle cx="38" cy="38" r="5" fill="currentColor" className="text-black/7" />
            <circle cx="8" cy="40" r="3" fill="currentColor" className="text-black/5" />
            <circle cx="42" cy="15" r="3.5" fill="currentColor" className="text-black/6" />

            {/* Small craters - detail */}
            <circle cx="18" cy="35" r="1.5" fill="currentColor" className="text-black/4" />
            <circle cx="32" cy="8" r="1.2" fill="currentColor" className="text-black/4" />
            <circle cx="5" cy="20" r="1" fill="currentColor" className="text-black/3" />
            <circle cx="45" cy="28" r="1.8" fill="currentColor" className="text-black/5" />
          </pattern>

          {/* Enhanced Radial Gradient - more realistic 3D depth */}
          <radialGradient id="moon-sphere" cx="45%" cy="45%" r="55%">
            <stop
              offset="0%"
              stopColor="currentColor"
              className="text-slate-50 dark:text-slate-50"
            />
            <stop
              offset="40%"
              stopColor="currentColor"
              className="text-slate-100 dark:text-slate-100"
            />
            <stop
              offset="70%"
              stopColor="currentColor"
              className="text-slate-200 dark:text-slate-200"
            />
            <stop
              offset="90%"
              stopColor="currentColor"
              className="text-slate-300 dark:text-slate-400"
            />
            <stop
              offset="100%"
              stopColor="currentColor"
              className="text-slate-400 dark:text-slate-500"
            />
          </radialGradient>

          {/* Rim light gradient for edge highlight */}
          <radialGradient id="rim-light" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="85%" stopColor="transparent" />
            <stop
              offset="95%"
              stopColor="currentColor"
              className="text-white/40 dark:text-white/30"
            />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Subtle inner shadow for depth */}
          <radialGradient id="inner-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="80%" stopColor="transparent" />
            <stop
              offset="100%"
              stopColor="currentColor"
              className="text-black/15 dark:text-black/25"
            />
          </radialGradient>
        </defs>

        {/* 1. Dark Moon Base (Shadow side) - enhanced darkness */}
        <circle cx="100" cy="100" r="100" className="fill-slate-700 dark:fill-slate-900" />

        {/* 2. Lit Portion - Enhanced 3D sphere gradient */}
        <path d={litPath} fill="url(#moon-sphere)" />

        {/* 3. Crater Texture Overlay - only on lit part */}
        <path d={litPath} fill="url(#craters)" className="opacity-40 mix-blend-multiply" />

        {/* 4. Rim Light - subtle edge highlight for 3D effect */}
        <circle cx="100" cy="100" r="100" fill="url(#rim-light)" className="pointer-events-none" />

        {/* 5. Inner shadow for depth perception */}
        <circle
          cx="100"
          cy="100"
          r="100"
          fill="url(#inner-shadow)"
          className="pointer-events-none"
        />

        {/* 6. Subtle atmospheric edge glow */}
        <circle
          cx="100"
          cy="100"
          r="99"
          className="fill-none stroke-white/10 dark:stroke-white/5"
          strokeWidth="2"
        />
      </motion.svg>
    </motion.div>
  );
}
