/**
 * Element data extraction and serialization
 */

import { generateSelector } from "../utils/selectors";
import { getViewportInfo } from "../utils/viewport";
import type { BoundingBox, Feedback, FeedbackType } from "./state";

export interface CaptureData {
  /** Stable identifier injected on the DOM element for replay */
  orphyId: string;
  /** CSS selector (best effort) */
  selector: string;
  /** Primary anchor: element bounding box at capture time */
  boundingBox: BoundingBox;
  /** Click position relative to element's top-left */
  positionInElement: { x: number; y: number };
  /** Click position relative to viewport */
  positionInViewport: { x: number; y: number };
  viewport: ReturnType<typeof getViewportInfo>;
  pageUrl: string;
}

export function captureElement(element: HTMLElement, clickX: number, clickY: number): CaptureData {
  const rect = element.getBoundingClientRect();

  // Generate stable ID and inject on the element for replay
  const orphyId = generateOrphyId();
  element.setAttribute("data-orphy-id", orphyId);

  return {
    orphyId,
    selector: generateSelector(element),
    boundingBox: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    positionInElement: {
      x: Math.round(clickX - rect.left),
      y: Math.round(clickY - rect.top),
    },
    positionInViewport: {
      x: Math.round(clickX),
      y: Math.round(clickY),
    },
    viewport: getViewportInfo(),
    pageUrl: window.location.href,
  };
}

export function createFeedback(captureData: CaptureData, feedbackType: FeedbackType, comment: string): Feedback {
  return {
    id: generateId(),
    orphyId: captureData.orphyId,
    selector: captureData.selector,
    boundingBox: captureData.boundingBox,
    positionInElement: captureData.positionInElement,
    positionInViewport: captureData.positionInViewport,
    viewport: captureData.viewport,
    pageUrl: captureData.pageUrl,
    feedbackType,
    comment,
    timestamp: Date.now(),
  };
}

function generateId(): string {
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateOrphyId(): string {
  return `rv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
