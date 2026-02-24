import { useUIStore } from '@/features/stores/uiStore';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
      )}
    </button>
  );
}
