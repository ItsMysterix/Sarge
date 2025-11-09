import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive media queries
 * Returns true if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
 * const isDesktop = useMediaQuery('(min-width: 1025px)')
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } 
    // Fallback for older browsers
    else if (media.addListener) {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints hook
 * Returns an object with common breakpoint matches
 */
export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Convenience flags
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop || isLargeDesktop,
  };
}

/**
 * Device orientation hook
 */
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return { isPortrait, isLandscape };
}

/**
 * Accessibility preferences hook
 */
export function useAccessibilityPreferences() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  
  return {
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
  };
}
