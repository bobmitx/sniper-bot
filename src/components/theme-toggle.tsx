'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9">
        <div className="w-4 h-4 flex items-center justify-center">
          <Sun className="h-4 w-4" />
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <Sun className="h-4 w-4 absolute transition-all dark:-rotate-90 dark:scale-0 rotate-0 scale-100" />
            <Moon className="h-4 w-4 absolute transition-all dark:rotate-0 dark:scale-100 rotate-90 scale-0" />
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function ThemeToggleCompact() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9">
        <div className="w-4 h-4 flex items-center justify-center">
          <Sun className="h-4 w-4" />
        </div>
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="h-11 w-11 sm:h-9 sm:w-9"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun className="h-4 w-4 absolute transition-all dark:-rotate-90 dark:scale-0 rotate-0 scale-100" />
        <Moon className="h-4 w-4 absolute transition-all dark:rotate-0 dark:scale-100 rotate-90 scale-0" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
