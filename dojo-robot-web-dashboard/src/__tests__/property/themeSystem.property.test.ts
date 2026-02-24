/**
 * Property-based tests for theme system
 * **Validates: Requirements 11.4, 11.6, 11.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/features/stores/uiStore';
import type { Theme } from '@/features/stores/uiStore';

/**
 * Helper function to convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Helper function to calculate relative luminance
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Helper function to calculate contrast ratio
 * Based on WCAG 2.1 specification
 */
function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const l1 = getRelativeLuminance(...color1);
  const l2 = getRelativeLuminance(...color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse HSL color string from CSS variable format
 * Format: "222.2 84% 4.9%"
 */
function parseHslString(hslString: string): [number, number, number] {
  const parts = hslString.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  return [h, s, l];
}

/**
 * Theme color definitions from index.css
 */
const themeColors = {
  light: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 36.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 0%',
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
  },
};

describe('Property 51: Theme Persistence Round-Trip', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Property: Theme persistence round-trip
   * For any theme preference (light or dark), setting the theme should persist it
   * to local storage, and reloading the page should apply the saved theme.
   * 
   * **Validates: Requirements 11.4**
   */
  it('should persist theme to localStorage and restore on reload', () => {
    fc.assert(
      fc.property(fc.constantFrom<Theme>('light', 'dark'), (theme) => {
        // Clear any existing state
        localStorage.clear();

        // First render - set theme
        const { result: result1, unmount: unmount1 } = renderHook(() =>
          useUIStore()
        );

        act(() => {
          result1.current.setTheme(theme);
        });

        // Verify theme is set in memory
        expect(result1.current.theme).toBe(theme);

        // Verify theme is persisted to localStorage
        const storedData = localStorage.getItem('ui-storage');
        expect(storedData).not.toBeNull();

        if (storedData) {
          const parsed = JSON.parse(storedData);
          expect(parsed.state.theme).toBe(theme);
        }

        // Unmount to simulate page unload
        unmount1();

        // Second render - simulate page reload
        const { result: result2, unmount: unmount2 } = renderHook(() =>
          useUIStore()
        );

        // Verify theme is restored from localStorage
        expect(result2.current.theme).toBe(theme);

        // Clean up
        unmount2();
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Theme toggle persistence
   * Toggling theme should persist the new value
   * 
   * **Validates: Requirements 11.4**
   */
  it('should persist toggled theme correctly', () => {
    fc.assert(
      fc.property(fc.constantFrom<Theme>('light', 'dark'), (initialTheme) => {
        localStorage.clear();

        const { result, unmount } = renderHook(() => useUIStore());

        // Set initial theme
        act(() => {
          result.current.setTheme(initialTheme);
        });

        // Toggle theme
        act(() => {
          result.current.toggleTheme();
        });

        const expectedTheme = initialTheme === 'light' ? 'dark' : 'light';

        // Verify toggled theme is in memory
        expect(result.current.theme).toBe(expectedTheme);

        // Verify toggled theme is persisted
        const storedData = localStorage.getItem('ui-storage');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          expect(parsed.state.theme).toBe(expectedTheme);
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Multiple theme changes preserve last value
   * After multiple theme changes, only the last value should be persisted
   * 
   * **Validates: Requirements 11.4**
   */
  it('should preserve only the last theme value after multiple changes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<Theme>('light', 'dark'), {
          minLength: 1,
          maxLength: 10,
        }),
        (themeSequence) => {
          localStorage.clear();

          const { result, unmount } = renderHook(() => useUIStore());

          // Apply all theme changes
          themeSequence.forEach((theme) => {
            act(() => {
              result.current.setTheme(theme);
            });
          });

          const lastTheme = themeSequence[themeSequence.length - 1];

          // Verify last theme is in memory
          expect(result.current.theme).toBe(lastTheme);

          // Verify last theme is persisted
          const storedData = localStorage.getItem('ui-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.theme).toBe(lastTheme);
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 52: Text Contrast Ratio Validation', () => {
  /**
   * Property: Text contrast ratio meets WCAG AA standards
   * For any text element in both light and dark themes, the contrast ratio between
   * text and background should meet WCAG AA standards (minimum 4.5:1 for normal text,
   * 3:1 for large text).
   * 
   * **Validates: Requirements 11.6, 11.9**
   */
  it('should meet WCAG AA contrast ratio for normal text (4.5:1) in light theme', () => {
    const theme = themeColors.light;

    // Test all text/background combinations
    const textBackgroundPairs: Array<{
      text: string;
      background: string;
      name: string;
    }> = [
      {
        text: theme.foreground,
        background: theme.background,
        name: 'foreground on background',
      },
      {
        text: theme.cardForeground,
        background: theme.card,
        name: 'card foreground on card',
      },
      {
        text: theme.popoverForeground,
        background: theme.popover,
        name: 'popover foreground on popover',
      },
      {
        text: theme.primaryForeground,
        background: theme.primary,
        name: 'primary foreground on primary',
      },
      {
        text: theme.secondaryForeground,
        background: theme.secondary,
        name: 'secondary foreground on secondary',
      },
      {
        text: theme.mutedForeground,
        background: theme.muted,
        name: 'muted foreground on muted',
      },
      {
        text: theme.accentForeground,
        background: theme.accent,
        name: 'accent foreground on accent',
      },
      {
        text: theme.destructiveForeground,
        background: theme.destructive,
        name: 'destructive foreground on destructive',
      },
    ];

    textBackgroundPairs.forEach(({ text, background, name }) => {
      const textHsl = parseHslString(text);
      const bgHsl = parseHslString(background);

      const textRgb = hslToRgb(...textHsl);
      const bgRgb = hslToRgb(...bgHsl);

      const contrastRatio = getContrastRatio(textRgb, bgRgb);

      // WCAG AA requires 4.5:1 for normal text
      expect(
        contrastRatio,
        `Light theme ${name} contrast ratio ${contrastRatio.toFixed(2)}:1 should be at least 4.5:1`
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('should meet WCAG AA contrast ratio for normal text (4.5:1) in dark theme', () => {
    const theme = themeColors.dark;

    // Test all text/background combinations
    const textBackgroundPairs: Array<{
      text: string;
      background: string;
      name: string;
    }> = [
      {
        text: theme.foreground,
        background: theme.background,
        name: 'foreground on background',
      },
      {
        text: theme.cardForeground,
        background: theme.card,
        name: 'card foreground on card',
      },
      {
        text: theme.popoverForeground,
        background: theme.popover,
        name: 'popover foreground on popover',
      },
      {
        text: theme.primaryForeground,
        background: theme.primary,
        name: 'primary foreground on primary',
      },
      {
        text: theme.secondaryForeground,
        background: theme.secondary,
        name: 'secondary foreground on secondary',
      },
      {
        text: theme.mutedForeground,
        background: theme.muted,
        name: 'muted foreground on muted',
      },
      {
        text: theme.accentForeground,
        background: theme.accent,
        name: 'accent foreground on accent',
      },
      {
        text: theme.destructiveForeground,
        background: theme.destructive,
        name: 'destructive foreground on destructive',
      },
    ];

    textBackgroundPairs.forEach(({ text, background, name }) => {
      const textHsl = parseHslString(text);
      const bgHsl = parseHslString(background);

      const textRgb = hslToRgb(...textHsl);
      const bgRgb = hslToRgb(...bgHsl);

      const contrastRatio = getContrastRatio(textRgb, bgRgb);

      // WCAG AA requires 4.5:1 for normal text
      expect(
        contrastRatio,
        `Dark theme ${name} contrast ratio ${contrastRatio.toFixed(2)}:1 should be at least 4.5:1`
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  /**
   * Property: Contrast ratio calculation is symmetric
   * The contrast ratio should be the same regardless of which color is considered
   * foreground or background
   */
  it('should calculate symmetric contrast ratios', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        fc.constantFrom(
          'foreground',
          'cardForeground',
          'popoverForeground',
          'primaryForeground',
          'secondaryForeground',
          'mutedForeground',
          'accentForeground',
          'destructiveForeground'
        ),
        fc.constantFrom(
          'background',
          'card',
          'popover',
          'primary',
          'secondary',
          'muted',
          'accent',
          'destructive'
        ),
        (theme, fgKey, bgKey) => {
          const colors = themeColors[theme];
          const fg = colors[fgKey as keyof typeof colors];
          const bg = colors[bgKey as keyof typeof colors];

          const fgHsl = parseHslString(fg);
          const bgHsl = parseHslString(bg);

          const fgRgb = hslToRgb(...fgHsl);
          const bgRgb = hslToRgb(...bgHsl);

          const ratio1 = getContrastRatio(fgRgb, bgRgb);
          const ratio2 = getContrastRatio(bgRgb, fgRgb);

          // Contrast ratio should be symmetric
          expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Contrast ratio is always positive and >= 1
   * By definition, contrast ratio must be at least 1:1 (same color)
   */
  it('should always produce contrast ratios >= 1', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        fc.constantFrom(
          'foreground',
          'background',
          'card',
          'cardForeground',
          'primary',
          'primaryForeground'
        ),
        fc.constantFrom(
          'foreground',
          'background',
          'card',
          'cardForeground',
          'primary',
          'primaryForeground'
        ),
        (theme, color1Key, color2Key) => {
          const colors = themeColors[theme];
          const color1 = colors[color1Key as keyof typeof colors];
          const color2 = colors[color2Key as keyof typeof colors];

          const hsl1 = parseHslString(color1);
          const hsl2 = parseHslString(color2);

          const rgb1 = hslToRgb(...hsl1);
          const rgb2 = hslToRgb(...hsl2);

          const ratio = getContrastRatio(rgb1, rgb2);

          // Contrast ratio must be at least 1:1
          expect(ratio).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Large text meets WCAG AA standard (3:1)
   * All text/background combinations should meet at least the large text standard
   */
  it('should meet WCAG AA contrast ratio for large text (3:1) in both themes', () => {
    fc.assert(
      fc.property(fc.constantFrom<Theme>('light', 'dark'), (theme) => {
        const colors = themeColors[theme];

        const textBackgroundPairs: Array<{
          text: string;
          background: string;
        }> = [
          { text: colors.foreground, background: colors.background },
          { text: colors.cardForeground, background: colors.card },
          { text: colors.popoverForeground, background: colors.popover },
          { text: colors.primaryForeground, background: colors.primary },
          { text: colors.secondaryForeground, background: colors.secondary },
          { text: colors.mutedForeground, background: colors.muted },
          { text: colors.accentForeground, background: colors.accent },
          {
            text: colors.destructiveForeground,
            background: colors.destructive,
          },
        ];

        textBackgroundPairs.forEach(({ text, background }) => {
          const textHsl = parseHslString(text);
          const bgHsl = parseHslString(background);

          const textRgb = hslToRgb(...textHsl);
          const bgRgb = hslToRgb(...bgHsl);

          const contrastRatio = getContrastRatio(textRgb, bgRgb);

          // WCAG AA requires 3:1 for large text
          expect(contrastRatio).toBeGreaterThanOrEqual(3);
        });
      }),
      { numRuns: 20 }
    );
  });
});
