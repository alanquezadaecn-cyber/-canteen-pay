import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Button';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="rounded-full"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-500 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 transition-transform duration-300 rotate-0" />
      )}
    </Button>
  );
};

export default ThemeToggle;
