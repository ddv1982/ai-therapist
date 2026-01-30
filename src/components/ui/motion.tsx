/**
 * Re-export framer-motion for now
 * TODO: Implement proper lazy loading when needed
 *
 * Note: framer-motion is only used in 5 components:
 * - not-found.tsx
 * - realistic-moon.tsx
 * - cbt-message.tsx
 * - theme-toggle.tsx
 *
 * Strategy: Lazy load at component level, not here
 */

'use client';

export { motion, AnimatePresence, Reorder, useReducedMotion } from 'framer-motion';
