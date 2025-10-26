'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const sunVariants = {
    initial: { rotate: -90, scale: 0, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: 90, scale: 0, opacity: 0 },
  };

  const moonVariants = {
    initial: { rotate: 90, scale: 0, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: -90, scale: 0, opacity: 0 },
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={therapeuticInteractive.iconButtonMedium + ' relative group items-center justify-center'}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative h-6 w-6 z-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {theme === 'light' ? (
            <motion.div
              key="sun"
              variants={sunVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 m-auto flex items-center justify-center"
            >
              <Sun className="h-6 w-6 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              variants={moonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 m-auto flex items-center justify-center"
            >
              <Moon className="h-6 w-6 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="sr-only">Toggle theme</span>

      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-muted pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.8 }}
        transition={{ duration: 0.2 }}
      />
    </Button>
  );
}