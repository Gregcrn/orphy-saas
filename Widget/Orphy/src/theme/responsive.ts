/**
 * Responsive styles injection
 * Uses CSS custom properties + media queries for adaptive layouts
 */

const STYLE_ID = "orphy-responsive-styles";

// Breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
} as const;

export function injectResponsiveStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* =================================================================
       REVIEWLY RESPONSIVE STYLES
       ================================================================= */

    /* CSS Custom Properties - Desktop defaults */
    :root {
      --orphy-comment-box-width: 420px;
      --orphy-comment-box-position: fixed;
      --orphy-comment-box-bottom: auto;
      --orphy-comment-box-left: auto;
      --orphy-comment-box-right: auto;
      --orphy-comment-box-transform: none;
      --orphy-comment-box-radius: 8px;
      --orphy-comment-box-max-height: 80vh;

      --orphy-panel-width: 320px;

      --orphy-type-grid: flex;
      --orphy-type-direction: row;
      --orphy-type-wrap: nowrap;
    }

    /* =================================================================
       TABLET (480px - 768px)
       ================================================================= */
    @media screen and (max-width: ${BREAKPOINTS.tablet}px) {
      :root {
        --orphy-comment-box-width: 380px;
      }
    }

    /* =================================================================
       MOBILE (< 480px)
       ================================================================= */
    @media screen and (max-width: ${BREAKPOINTS.mobile}px) {
      :root {
        --orphy-comment-box-width: calc(100vw - 32px);
        --orphy-comment-box-radius: 12px 12px 0 0;
        --orphy-panel-width: 100vw;
        --orphy-type-wrap: wrap;
      }

      /* Comment box - Bottom sheet style on mobile */
      .orphy-comment-box {
        position: fixed !important;
        bottom: 0 !important;
        left: 16px !important;
        right: 16px !important;
        top: auto !important;
        width: calc(100vw - 32px) !important;
        max-width: none !important;
        border-radius: 12px 12px 0 0 !important;
        max-height: 70vh !important;
        animation: orphy-slide-up 0.25s ease-out;
      }

      /* Type selector - wrap on mobile */
      .orphy-type-selector {
        flex-wrap: wrap !important;
        gap: 8px !important;
      }

      .orphy-type-selector button {
        flex: 1 1 calc(50% - 4px) !important;
        min-width: calc(50% - 4px) !important;
        justify-content: center !important;
      }

      /* Review panel - Full width bottom sheet */
      .orphy-review-panel {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        width: 100vw !important;
        max-width: none !important;
        border-radius: 12px 12px 0 0 !important;
        max-height: 80vh !important;
        animation: orphy-slide-up 0.25s ease-out;
      }

      /* Toolbar - Adjust position for thumb reach */
      .orphy-toolbar {
        bottom: 20px !important;
        right: 16px !important;
      }
    }

    /* =================================================================
       ANIMATIONS
       ================================================================= */
    @keyframes orphy-slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes orphy-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* =================================================================
       TOUCH IMPROVEMENTS
       ================================================================= */
    @media (hover: none) and (pointer: coarse) {
      /* Larger touch targets on touch devices */
      .orphy-type-selector button {
        min-height: 44px !important;
        padding: 10px 12px !important;
      }

      .orphy-comment-submit,
      .orphy-comment-cancel {
        min-height: 44px !important;
        padding: 12px 16px !important;
      }

      /* Disable hover effects on touch */
      .orphy-toolbar button:hover {
        transform: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

export function removeResponsiveStyles(): void {
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}
