/**
 * Screen reader announcer utility
 * Provides accessible announcements for dynamic content changes
 */

let announcerElement: HTMLDivElement | null = null;

/**
 * Initialize the screen reader announcer
 * Creates a live region for screen reader announcements
 */
export function initAnnouncer() {
  if (announcerElement) return;

  announcerElement = document.createElement('div');
  announcerElement.setAttribute('role', 'status');
  announcerElement.setAttribute('aria-live', 'polite');
  announcerElement.setAttribute('aria-atomic', 'true');
  announcerElement.className = 'sr-only';
  announcerElement.style.position = 'absolute';
  announcerElement.style.left = '-10000px';
  announcerElement.style.width = '1px';
  announcerElement.style.height = '1px';
  announcerElement.style.overflow = 'hidden';

  document.body.appendChild(announcerElement);
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (!announcerElement) {
    initAnnouncer();
  }

  if (!announcerElement) return;

  // Update aria-live attribute based on priority
  announcerElement.setAttribute('aria-live', priority);

  // Clear previous message
  announcerElement.textContent = '';

  // Set new message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    if (announcerElement) {
      announcerElement.textContent = message;
    }
  }, 100);
}

/**
 * Announce an error message to screen readers
 * Uses assertive priority for immediate attention
 */
export function announceError(message: string) {
  announce(message, 'assertive');
}

/**
 * Announce a success message to screen readers
 */
export function announceSuccess(message: string) {
  announce(message, 'polite');
}

/**
 * Announce a loading state to screen readers
 */
export function announceLoading(message: string = 'Loading...') {
  announce(message, 'polite');
}

/**
 * Announce completion of a loading state
 */
export function announceLoaded(message: string = 'Content loaded') {
  announce(message, 'polite');
}
