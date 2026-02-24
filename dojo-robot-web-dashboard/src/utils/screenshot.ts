/**
 * Screenshot capture utilities
 * Captures DOM elements as images using html2canvas
 */

import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  filename?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Capture a screenshot of a DOM element
 * @param element - The DOM element to capture
 * @param options - Screenshot options
 * @returns Promise that resolves when screenshot is captured
 */
export async function captureScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<void> {
  const {
    filename = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}`,
    format = 'png',
    quality = 0.95,
    backgroundColor = '#ffffff',
    scale = 2, // Higher scale for better quality
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        `image/${format}`,
        quality
      );
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw error;
  }
}

/**
 * Capture a screenshot by element ID
 * @param elementId - The ID of the element to capture
 * @param options - Screenshot options
 * @returns Promise that resolves when screenshot is captured
 */
export async function captureScreenshotById(
  elementId: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  return captureScreenshot(element, options);
}

/**
 * Capture a screenshot of the entire viewport
 * @param options - Screenshot options
 * @returns Promise that resolves when screenshot is captured
 */
export async function captureViewportScreenshot(
  options: ScreenshotOptions = {}
): Promise<void> {
  return captureScreenshot(document.body, options);
}
