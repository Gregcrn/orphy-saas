/**
 * Viewport and scroll utilities
 */

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
}

export function getViewportInfo(): ViewportInfo {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  };
}

export function getScrollPosition(): ScrollPosition {
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

export function getDocumentSize(): { width: number; height: number } {
  return {
    width: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth
    ),
    height: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    ),
  };
}
