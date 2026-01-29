/**
 * Badges Layer - Floating numbered badges for annotated elements
 * Works on ALL elements including <input>, <img>, etc.
 * Design: Uses Orphy caramel design system
 */

import { sessionStore, type FeedbackDraft, type DraftStatus } from "../core/session";
import { colors, typography, borders } from "../theme";

let layerEl: HTMLDivElement | null = null;
let rafId: number | null = null;
const badges: Map<string, HTMLDivElement> = new Map();

const BADGE_SIZE = 22;

const STATUS_COLORS: Record<DraftStatus, string> = {
  draft: colors.accent.primary,
  sending: colors.status.sending,
  sent: colors.status.success,
  error: colors.status.error,
};

/**
 * Initialize badges layer
 */
export function initBadgesLayer(): void {
  if (layerEl) return;

  layerEl = document.createElement("div");
  layerEl.id = "orphy-badges-layer";
  Object.assign(layerEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "999996",
  });

  document.body.appendChild(layerEl);

  // Subscribe to session changes
  sessionStore.subscribe(updateBadges);

  // Update positions on scroll/resize
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
}

/**
 * Destroy badges layer
 */
export function destroyBadgesLayer(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.removeEventListener("scroll", scheduleUpdate);
  window.removeEventListener("resize", scheduleUpdate);

  badges.clear();
  layerEl?.remove();
  layerEl = null;
}

/**
 * Hide badges layer (keep drafts, just hide visually)
 */
export function hideBadgesLayer(): void {
  if (layerEl) {
    layerEl.style.display = "none";
  }
}

/**
 * Show badges layer
 */
export function showBadgesLayer(): void {
  if (layerEl) {
    layerEl.style.display = "block";
    updateBadges(); // Refresh positions
  }
}

/**
 * Update badges based on session state
 */
function updateBadges(): void {
  if (!layerEl) return;

  const drafts = sessionStore.getDrafts();

  // Build map of elements with their drafts (grouped by orphyId)
  const elementToDrafts = new Map<string, { element: HTMLElement; drafts: FeedbackDraft[] }>();

  drafts.forEach((draft) => {
    let element = draft.element;

    // Recovery: if element is detached, try to find it again
    if (!element.isConnected) {
      const recovered = document.querySelector(draft.selector) as HTMLElement;
      if (recovered) {
        draft.element = recovered;
        element = recovered;
      } else {
        return;
      }
    }

    // Group by orphyId
    const existing = elementToDrafts.get(draft.orphyId);
    if (existing) {
      existing.drafts.push(draft);
    } else {
      elementToDrafts.set(draft.orphyId, { element, drafts: [draft] });
    }
  });

  // Remove badges for elements no longer in drafts
  const currentOrphyIds = new Set(elementToDrafts.keys());
  badges.forEach((badgeEl, orphyId) => {
    if (!currentOrphyIds.has(orphyId)) {
      badgeEl.remove();
      badges.delete(orphyId);
    }
  });

  // Create or update badges
  elementToDrafts.forEach(({ element, drafts: elementDrafts }, orphyId) => {
    const count = elementDrafts.length;
    const firstDraft = elementDrafts[0];
    if (!firstDraft) return;

    // Determine badge status (prioritize: error > sending > draft > sent)
    const status = elementDrafts.some((d) => d.status === "error")
      ? "error"
      : elementDrafts.some((d) => d.status === "sending")
        ? "sending"
        : elementDrafts.some((d) => d.status === "draft")
          ? "draft"
          : "sent";

    let badgeEl = badges.get(orphyId);

    if (!badgeEl) {
      badgeEl = createBadge(count, status);
      layerEl!.appendChild(badgeEl);
      badges.set(orphyId, badgeEl);
    } else {
      // Update content and color
      badgeEl.textContent = String(count);
      badgeEl.style.backgroundColor = STATUS_COLORS[status];
    }

    // Update position
    updateBadgePosition(badgeEl, element);
  });
}

/**
 * Create a badge element
 */
function createBadge(index: number, status: DraftStatus): HTMLDivElement {
  const badge = document.createElement("div");
  badge.className = "orphy-badge";
  badge.textContent = String(index);

  Object.assign(badge.style, {
    position: "absolute",
    width: `${BADGE_SIZE}px`,
    height: `${BADGE_SIZE}px`,
    borderRadius: borders.radius.full,
    backgroundColor: STATUS_COLORS[status],
    color: colors.text.inverse,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    fontFamily: typography.family.sans,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Universal visibility: white ring + dark outer shadow
    boxShadow: `
      0 0 0 2px rgba(255, 255, 255, 0.95),
      0 0 0 3px rgba(0, 0, 0, 0.2),
      0 2px 8px rgba(0, 0, 0, 0.25)
    `.replace(/\s+/g, ' ').trim(),
    transition: "background-color 0.2s ease-out",
  });

  return badge;
}

/**
 * Update badge position based on element
 */
function updateBadgePosition(badge: HTMLDivElement, element: HTMLElement): void {
  const rect = element.getBoundingClientRect();

  // Position at top-left corner of element, offset to be half outside
  badge.style.left = `${rect.left - BADGE_SIZE / 2}px`;
  badge.style.top = `${rect.top - BADGE_SIZE / 2}px`;
}

/**
 * Update all badge positions
 */
function updateAllPositions(): void {
  const drafts = sessionStore.getDrafts();

  // Group by orphyId to get one element per badge
  const seenOrphyIds = new Set<string>();

  drafts.forEach((draft) => {
    // Only process first occurrence of each orphyId
    if (seenOrphyIds.has(draft.orphyId)) return;
    seenOrphyIds.add(draft.orphyId);

    const badge = badges.get(draft.orphyId);
    if (badge && draft.element.isConnected) {
      updateBadgePosition(badge, draft.element);
    }
  });
}

/**
 * Schedule position update via RAF
 */
function scheduleUpdate(): void {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    updateAllPositions();
  });
}

/**
 * Force update positions (call after layout changes)
 */
export function refreshBadgePositions(): void {
  updateAllPositions();
}
