import { useEffect } from 'react';
import { useUIStore } from '@/features/stores/uiStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    
    // Add transition class before theme change
    root.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease');
    
    // Remove old theme and add new theme
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Clean up transition after animation completes
    const timeoutId = setTimeout(() => {
      root.style.removeProperty('transition');
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [theme]);

  return <>{children}</>;
}
