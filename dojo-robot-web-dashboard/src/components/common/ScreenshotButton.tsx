/**
 * ScreenshotButton component
 * Button to capture screenshots of visualization panels or any element
 */

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { captureScreenshot } from '../../utils/screenshot';
import type { ScreenshotOptions } from '../../utils/screenshot';

interface ScreenshotButtonProps {
  /**
   * Target element to capture
   * Can be an HTMLElement, element ID, or ref
   */
  target?: HTMLElement | string | React.RefObject<HTMLElement>;
  
  /**
   * Screenshot options
   */
  options?: ScreenshotOptions;
  
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'icon';
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Callback when screenshot is captured
   */
  onCapture?: () => void;
  
  /**
   * Callback when screenshot capture fails
   */
  onError?: (error: Error) => void;
}

export const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({
  target,
  options = {},
  variant = 'secondary',
  size = 'md',
  className = '',
  onCapture,
  onError,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);

    try {
      let element: HTMLElement | null = null;

      // Resolve target element
      if (!target) {
        // Capture parent element if no target specified
        element = document.body;
      } else if (typeof target === 'string') {
        // Target is element ID
        element = document.getElementById(target);
        if (!element) {
          throw new Error(`Element with ID "${target}" not found`);
        }
      } else if ('current' in target) {
        // Target is a ref
        element = target.current;
        if (!element) {
          throw new Error('Target ref is null');
        }
      } else {
        // Target is HTMLElement
        element = target;
      }

      // Capture screenshot
      await captureScreenshot(element, options);

      // Call success callback
      onCapture?.();
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      onError?.(error as Error);
    } finally {
      setIsCapturing(false);
    }
  };

  // Button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded transition-colors';
    
    const variantStyles = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
      secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100',
      icon: 'bg-transparent text-gray-600 hover:bg-gray-100 disabled:text-gray-400',
    };
    
    const sizeStyles = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  };

  return (
    <button
      onClick={handleCapture}
      disabled={isCapturing}
      className={getButtonStyles()}
      title="Capture screenshot"
    >
      <Camera className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      {variant !== 'icon' && (
        <span>{isCapturing ? 'Capturing...' : 'Screenshot'}</span>
      )}
    </button>
  );
};

/**
 * Hook for programmatic screenshot capture
 */
export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const capture = async (
    target: HTMLElement | string | React.RefObject<HTMLElement>,
    options: ScreenshotOptions = {}
  ) => {
    setIsCapturing(true);
    setError(null);

    try {
      let element: HTMLElement | null = null;

      if (typeof target === 'string') {
        element = document.getElementById(target);
        if (!element) {
          throw new Error(`Element with ID "${target}" not found`);
        }
      } else if ('current' in target) {
        element = target.current;
        if (!element) {
          throw new Error('Target ref is null');
        }
      } else {
        element = target;
      }

      await captureScreenshot(element, options);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsCapturing(false);
    }
  };

  return { capture, isCapturing, error };
}
