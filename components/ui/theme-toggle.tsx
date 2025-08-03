'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-all duration-300 group border-2 border-primary/20 overflow-hidden"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Shimmer effect */}
      <div className="shimmer-effect"></div>
      <div className="relative h-4 w-4 z-10">
        <Sun 
          className={`absolute h-4 w-4 transition-all duration-500 ease-in-out ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`absolute h-4 w-4 transition-all duration-500 ease-in-out ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
      
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30' 
          : 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 group-hover:from-orange-500/30 group-hover:to-yellow-500/30'
      } opacity-0 group-hover:opacity-100`}></div>
    </Button>
  );
}