/**
 * Orphy - Web Feedback Widget
 * Entry point and public API
 */


import { store, type Feedback, type FeedbackType } from "./core/state";
import { setLocale, t, type Locale } from "./i18n";
import { sessionStore, type FeedbackDraft } from "./core/session";
import { getDeviceInfo, type DeviceInfo } from "./utils/device";
import { createOverlay, destroyOverlay, lockHighlight, unlockHighlight } from "./core/overlay";
import { destroyHighlight, hideHighlight, showHighlight } from "./core/highlight";
import { captureElement, type CaptureData } from "./core/capture";
import { enterReplayMode, exitReplayMode, isReplayActive, setReplayConfig } from "./core/replay";
import { initMarkers, clearMarkers, updateMarkers } from "./core/markers";
import { initBadgesLayer, destroyBadgesLayer, hideBadgesLayer, showBadgesLayer } from "./ui/badges-layer";
import { showReviewPanel, hideReviewPanel, setSubmitLoading } from "./ui/review-panel";
import { createToolbar, destroyToolbar } from "./ui/toolbar";
import { showCommentBox, hideCommentBox } from "./ui/comment-box";
import { showToast, hideAllToasts } from "./ui/toast";
import { injectResponsiveStyles, removeResponsiveStyles } from "./theme/responsive";

export const VERSION = "0.1.0";

export type { Feedback };

export interface OrphyConfig {
  /** Project ID from Orphy dashboard */
  projectId: string;
  /** API endpoint URL (e.g., "https://your-app.com/api/feedbacks") */
  apiUrl: string;
  /** Locale for UI text ('fr' | 'en'), defaults to 'fr' */
  locale?: Locale;
  /** Optional callback after feedback is submitted */
  onSubmit?: (feedback: Feedback) => void;
  /** Optional callback on API error */
  onError?: (error: Error, feedback: Feedback) => void;
}

let config: OrphyConfig | null = null;
let initialized = false;

/**
 * Initialize the Orphy widget
 */
export function init(userConfig: OrphyConfig): void {
  if (initialized) {
    console.warn("Orphy is already initialized");
    return;
  }

  if (!userConfig.projectId || typeof userConfig.projectId !== "string") {
    throw new Error("Orphy: projectId is required");
  }

  if (!userConfig.apiUrl || typeof userConfig.apiUrl !== "string") {
    throw new Error("Orphy: apiUrl is required");
  }

  config = userConfig;
  initialized = true;

  // Set locale (default: 'fr')
  setLocale(userConfig.locale ?? "fr");

  // Set replay config for potential replay mode
  // The apiUrl points to /api/feedback/batch, but replay uses /api/replay
  const replayApiUrl = config.apiUrl.replace(/\/feedback\/batch$/, "/replay");
  setReplayConfig({ apiUrl: replayApiUrl });

  // Check for replay mode
  const urlParams = new URLSearchParams(window.location.search);
  const replayId = urlParams.get("orphy_replay");

  if (replayId) {
    console.log(`Orphy v${VERSION} entering replay mode`);
    enterReplayMode(replayId);
    return; // Don't show toolbar in replay mode
  }

  // Inject responsive styles
  injectResponsiveStyles();
  // Initialize DOM markers (outline CSS)
  initMarkers();
  // Initialize badges layer (floating numbered badges)
  initBadgesLayer();

  createToolbar(handleToggle, handleReview);

  console.log(`Orphy v${VERSION} initialized`);
}

/**
 * Destroy the widget and cleanup
 */
export function destroy(): void {
  if (!initialized) return;

  // Exit replay mode if active
  if (isReplayActive()) {
    exitReplayMode();
  }

  deactivate();
  destroyToolbar();
  clearMarkers();
  destroyBadgesLayer();
  hideReviewPanel();
  hideAllToasts();
  removeResponsiveStyles();
  store.reset();
  sessionStore.clearSession();

  config = null;
  initialized = false;
}

/**
 * Toggle review mode
 */
export function toggle(): void {
  if (!initialized) {
    console.warn("Orphy is not initialized");
    return;
  }

  const { active } = store.getState();
  handleToggle(!active);
}

/**
 * Get all collected feedbacks
 */
export function getFeedbacks(): Feedback[] {
  return store.getFeedbacks();
}

/**
 * Check if widget is in review mode
 */
export function isActive(): boolean {
  return store.getState().active;
}

/**
 * Check if widget is in replay mode
 */
export { isReplayActive } from "./core/replay";

function handleToggle(active: boolean): void {
  if (active) {
    activate();
  } else {
    deactivate();
  }
}

function activate(): void {
  store.setState({ active: true });
  document.body.classList.add("orphy-mode");
  updateMarkers(); // Ensure markers are visible immediately
  showBadgesLayer(); // Show badges
  createOverlay(handleElementClick);
}

function deactivate(): void {
  store.setState({ active: false, currentElement: null });
  document.body.classList.remove("orphy-mode");
  hideCommentBox();
  hideHighlight();
  hideBadgesLayer(); // Hide badges (keep drafts)
  hideReviewPanel(); // Close panel if open
  destroyOverlay();
  destroyHighlight();
}

function handleElementClick(element: HTMLElement, x: number, y: number): void {
  // Capture element data
  const captureData = captureElement(element, x, y);

  // Lock highlight on this element while commenting
  lockHighlight();

  // Show comment box
  showCommentBox(
    captureData,
    x,
    y,
    (comment, data, feedbackType) => handleCommentSubmit(comment, data, feedbackType, element),
    handleCommentCancel
  );
}

function handleCommentSubmit(comment: string, captureData: CaptureData, feedbackType: FeedbackType, element: HTMLElement): void {
  // Unlock highlight and hide it
  unlockHighlight();
  hideHighlight();

  // Create draft instead of immediate submission
  if (!element) return;

  sessionStore.addDraft({
    orphyId: captureData.orphyId,
    selector: captureData.selector,
    boundingBox: captureData.boundingBox,
    positionInElement: captureData.positionInElement,
    positionInViewport: captureData.positionInViewport,
    viewport: captureData.viewport,
    pageUrl: captureData.pageUrl,
    feedbackType,
    comment,
    element,
  });
}

function handleCommentCancel(): void {
  // Unlock highlight and hide it
  unlockHighlight();
  hideHighlight();
}

function handleReview(): void {
  showReviewPanel(handleSubmitAll);
}

async function handleSubmitAll(drafts: FeedbackDraft[]): Promise<void> {
  if (!config) return;

  // Set loading state
  setSubmitLoading(true);

  // Mark all drafts as sending
  drafts.forEach((draft) => {
    sessionStore.updateDraft(draft.tempId, { status: "sending" });
  });

  // Capture device info once for all feedbacks in this batch
  const deviceInfo = getDeviceInfo();

  try {
    // Batch API call
    const response = await fetch(`${config.apiUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: config.projectId,
        feedbacks: drafts.map((draft) => ({
          orphyId: draft.orphyId,
          selector: draft.selector,
          boundingBox: draft.boundingBox,
          positionInElement: draft.positionInElement,
          positionInViewport: draft.positionInViewport,
          viewport: draft.viewport,
          pageUrl: draft.pageUrl,
          feedbackType: draft.feedbackType,
          comment: draft.comment,
          deviceInfo,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const { feedbacks } = (await response.json()) as { feedbacks: Feedback[] };

    // Mark all drafts as sent
    drafts.forEach((draft) => {
      sessionStore.updateDraft(draft.tempId, { status: "sent" });
    });

    // Reset loading state
    setSubmitLoading(false);

    // Call optional success callback for each feedback
    feedbacks.forEach((feedback) => {
      config?.onSubmit?.(feedback);
    });

    // Show success toast
    const count = feedbacks.length;
    showToast({
      type: "success",
      message: count === 1
        ? t("toast.successSingle")
        : t("toast.successMultiple", { count }),
    });

    // Close panel and clear session after short delay
    setTimeout(() => {
      hideReviewPanel();
      sessionStore.clearSession();
    }, 1000);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Orphy: Failed to submit feedbacks", error);

    // Reset loading state
    setSubmitLoading(false);

    // Mark all drafts as error
    drafts.forEach((draft) => {
      sessionStore.updateDraft(draft.tempId, { status: "error" });
    });

    // Show error toast with retry action
    showToast({
      type: "error",
      message: t("toast.error"),
      action: {
        label: t("toast.retry"),
        onClick: () => handleSubmitAll(drafts),
      },
    });

    // Call optional error callback (with placeholder feedback)
    if (config?.onError) {
      const onError = config.onError; // Capture in closure to avoid null check issues
      drafts.forEach((draft) => {
        const placeholderFeedback: Feedback = {
          id: draft.tempId,
          orphyId: draft.orphyId,
          selector: draft.selector,
          boundingBox: draft.boundingBox,
          positionInElement: draft.positionInElement,
          positionInViewport: draft.positionInViewport,
          viewport: draft.viewport,
          pageUrl: draft.pageUrl,
          feedbackType: draft.feedbackType,
          comment: draft.comment,
          timestamp: draft.timestamp,
        };
        onError(error, placeholderFeedback);
      });
    }
  }
}
