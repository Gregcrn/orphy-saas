/**
 * Widget state management
 */

import type { ViewportInfo } from "../utils/viewport";

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type FeedbackStatus = "open" | "in_progress" | "resolved";

export type FeedbackType = "bug" | "design" | "content" | "question";

export interface Feedback {
  id: string;
  /** Stable identifier injected on the DOM element for replay */
  orphyId: string;
  /** CSS selector (best effort - may break if DOM changes) */
  selector: string;
  /** Primary anchor: bounding box at capture time (viewport-relative) */
  boundingBox: BoundingBox;
  /** Click position relative to the element's top-left corner */
  positionInElement: { x: number; y: number };
  /** Click position relative to viewport */
  positionInViewport: { x: number; y: number };
  viewport: ViewportInfo;
  pageUrl: string;
  /** Type of feedback */
  feedbackType: FeedbackType;
  comment: string;
  /** Timestamp for local feedbacks */
  timestamp: number;
  /** Creation date from API (only present during replay) */
  createdAt?: number;
  /** Status from API (only present during replay) */
  status?: FeedbackStatus;
}

export interface WidgetState {
  active: boolean;
  feedbacks: Feedback[];
  currentElement: HTMLElement | null;
  commentBoxVisible: boolean;
}

type Listener = (state: WidgetState) => void;

function createStore() {
  let state: WidgetState = {
    active: false,
    feedbacks: [],
    currentElement: null,
    commentBoxVisible: false,
  };

  const listeners: Set<Listener> = new Set();

  return {
    getState(): WidgetState {
      return state;
    },

    setState(partial: Partial<WidgetState>): void {
      state = { ...state, ...partial };
      listeners.forEach((fn) => fn(state));
    },

    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    addFeedback(feedback: Feedback): void {
      state = { ...state, feedbacks: [...state.feedbacks, feedback] };
      listeners.forEach((fn) => fn(state));
    },

    getFeedbacks(): Feedback[] {
      return [...state.feedbacks];
    },

    reset(): void {
      state = {
        active: false,
        feedbacks: [],
        currentElement: null,
        commentBoxVisible: false,
      };
      listeners.forEach((fn) => fn(state));
    },
  };
}

export const store = createStore();
