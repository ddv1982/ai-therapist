'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={therapeuticInteractive.iconButtonMedium + ' relative group items-center justify-center'}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative h-6 w-6 z-10 flex items-center justify-center">
        <Sun 
          className={`absolute inset-0 m-auto h-6 w-6 transition-all duration-500 ease-in-out ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100 text-primary' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`absolute inset-0 m-auto h-6 w-6 transition-all duration-500 ease-in-out ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100 text-primary' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
      
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
        'bg-muted group-hover:bg-muted/80'
      } opacity-0 group-hover:opacity-100`}></div>
    </Button>
  );
}