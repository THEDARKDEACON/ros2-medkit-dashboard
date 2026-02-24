import type { Component } from '../types/api';

/**
 * Filters components based on a search term
 * Implements Property 2: Component Search Filtering
 * 
 * For any search term and any list of components, the filtered results
 * should only contain components whose name or identifier includes the
 * search term (case-insensitive).
 * 
 * @param components - Array of components to filter
 * @param searchTerm - Search term to filter by
 * @returns Filtered array of components
 */
export function filterComponents(
  components: Component[],
  searchTerm: string,
): Component[] {
  // Empty search term returns all components
  if (!searchTerm || searchTerm.trim().length === 0) {
    return components;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return components.filter((component) => {
    const nameMatch = component.name.toLowerCase().includes(normalizedSearch);
    const identifierMatch = component.identifier
      .toLowerCase()
      .includes(normalizedSearch);

    return nameMatch || identifierMatch;
  });
}

/**
 * Highlights matching text in a string
 * 
 * @param text - Text to highlight matches in
 * @param searchTerm - Search term to highlight
 * @returns Array of text segments with highlight flags
 */
export function highlightMatches(
  text: string,
  searchTerm: string,
): Array<{ text: string; highlighted: boolean }> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [{ text, highlighted: false }];
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const normalizedText = text.toLowerCase();
  const segments: Array<{ text: string; highlighted: boolean }> = [];

  let currentIndex = 0;
  let matchIndex = normalizedText.indexOf(normalizedSearch, currentIndex);

  while (matchIndex !== -1) {
    // Add non-highlighted text before match
    if (matchIndex > currentIndex) {
      segments.push({
        text: text.substring(currentIndex, matchIndex),
        highlighted: false,
      });
    }

    // Add highlighted match
    segments.push({
      text: text.substring(matchIndex, matchIndex + normalizedSearch.length),
      highlighted: true,
    });

    currentIndex = matchIndex + normalizedSearch.length;
    matchIndex = normalizedText.indexOf(normalizedSearch, currentIndex);
  }

  // Add remaining non-highlighted text
  if (currentIndex < text.length) {
    segments.push({
      text: text.substring(currentIndex),
      highlighted: false,
    });
  }

  return segments;
}
