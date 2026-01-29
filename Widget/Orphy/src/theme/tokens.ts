/**
 * Orphy Design System - Notion-like
 *
 * Philosophy: Calm, focused, professional
 * The UI should feel invisible, letting the feedback be the focus
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Backgrounds - Warm whites, not clinical
  bg: {
    primary: "#ffffff",
    secondary: "#f9f9f8", // Warm off-white
    tertiary: "#f1f1ef", // Subtle gray
    hover: "#ededec",
    active: "#e8e8e6",
  },

  // Text - Soft black, easier on eyes
  text: {
    primary: "#37352f", // Notion's signature text color
    secondary: "#6b6b6b",
    tertiary: "#9b9b9b",
    placeholder: "#b4b4b4",
    inverse: "#ffffff",
  },

  // Borders - Subtle, not harsh
  border: {
    default: "#e9e9e7",
    hover: "#d3d3d0",
    focus: "#a8a8a5",
  },

  // Accent - Warm caramel for Orphy identity
  accent: {
    primary: "#D4A373", // Orphy caramel
    hover: "#C4956A",
    soft: "#FDF6F0", // Warm cream background
  },

  // Status - Muted, not alarming
  status: {
    draft: "#6b6b6b",
    draftBg: "#f1f1ef",
    sending: "#c9a227",
    sendingBg: "#fef9e8",
    success: "#2e8b57",
    successBg: "#e8f5ed",
    error: "#c9444a",
    errorBg: "#fce8e8",
  },

  // Overlay
  overlay: {
    backdrop: "rgba(15, 15, 15, 0.6)",
    highlight: "rgba(212, 163, 115, 0.20)", // Soft caramel highlight
    highlightBorder: "rgba(212, 163, 115, 0.85)", // Strong border for visibility
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families - System fonts for performance
  family: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },

  // Font sizes - Modest scale
  size: {
    xs: "11px",
    sm: "12px",
    base: "14px",
    md: "15px",
    lg: "16px",
    xl: "18px",
  },

  // Font weights
  weight: {
    normal: "400",
    medium: "500",
    semibold: "600",
  },

  // Line heights
  lineHeight: {
    tight: "1.3",
    base: "1.5",
    relaxed: "1.6",
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
} as const;

// =============================================================================
// BORDERS
// =============================================================================

export const borders = {
  radius: {
    sm: "3px",
    md: "4px",
    lg: "6px",
    xl: "8px",
    full: "9999px",
  },

  width: {
    thin: "1px",
    medium: "1.5px",
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  // Notion-like subtle shadows
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
  lg: "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
  xl: "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",

  // Focus ring
  focus: "0 0 0 2px rgba(212, 163, 115, 0.35)",
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  // Durations - Quick, not sluggish
  duration: {
    fast: "100ms",
    base: "150ms",
    slow: "200ms",
  },

  // Easings - Smooth, natural
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  highlight: "999997",
  overlay: "999998",
  toolbar: "999999",
  modal: "1000000",
  tooltip: "1000001",
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

export const components = {
  toolbar: {
    bottom: "20px",
    right: "20px",
  },

  button: {
    height: {
      sm: "28px",
      md: "32px",
      lg: "36px",
    },
    padding: {
      sm: "6px 10px",
      md: "8px 12px",
      lg: "10px 16px",
    },
  },

  commentBox: {
    width: "420px",
    maxHeight: "400px",
  },

  panel: {
    width: "320px",
  },

  badge: {
    size: "20px",
    fontSize: "11px",
  },
} as const;

// =============================================================================
// THEME OBJECT (combined)
// =============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  components,
} as const;

export type Theme = typeof theme;
