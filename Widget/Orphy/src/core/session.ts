/**
 * Review session management - Figma-like draft system
 */

import type { BoundingBox, FeedbackType } from "./state";
import type { ViewportInfo } from "../utils/viewport";

export type DraftStatus = "draft" | "sending" | "sent" | "error";

export interface FeedbackDraft {
  /** Temporary ID for local tracking */
  tempId: string;
  /** Stable identifier injected on the DOM element */
  orphyId: string;
  /** CSS selector (best effort) */
  selector: string;
  /** Bounding box at capture time */
  boundingBox: BoundingBox;
  /** Click position relative to element */
  positionInElement: { x: number; y: number };
  /** Click position relative to viewport */
  positionInViewport: { x: number; y: number };
  /** Viewport info */
  viewport: ViewportInfo;
  /** Page URL */
  pageUrl: string;
  /** Type of feedback */
  feedbackType: FeedbackType;
  /** User comment */
  comment: string;
  /** Draft status */
  status: DraftStatus;
  /** Timestamp */
  timestamp: number;
  /** Reference to DOM element (for pin positioning) */
  element: HTMLElement;
}

export interface ReviewSession {
  /** Unique session ID */
  sessionId: string;
  /** Draft feedbacks */
  drafts: FeedbackDraft[];
  /** Whether session has been submitted */
  submitted: boolean;
}

type SessionListener = (session: ReviewSession) => void;

function createSessionStore() {
  let session: ReviewSession = {
    sessionId: generateSessionId(),
    drafts: [],
    submitted: false,
  };

  const listeners: Set<SessionListener> = new Set();

  return {
    getSession(): ReviewSession {
      return session;
    },

    getDrafts(): FeedbackDraft[] {
      return [...session.drafts];
    },

    getDraft(tempId: string): FeedbackDraft | null {
      return session.drafts.find((d) => d.tempId === tempId) ?? null;
    },

    getDraftCount(): number {
      return session.drafts.filter((d) => d.status === "draft").length;
    },

    /** Get all drafts for a specific element by orphyId */
    getDraftsByElement(orphyId: string): FeedbackDraft[] {
      return session.drafts.filter((d) => d.orphyId === orphyId);
    },

    addDraft(draft: Omit<FeedbackDraft, "tempId" | "status" | "timestamp">): FeedbackDraft {
      const newDraft: FeedbackDraft = {
        ...draft,
        tempId: generateTempId(),
        status: "draft",
        timestamp: Date.now(),
      };

      session = {
        ...session,
        drafts: [...session.drafts, newDraft],
      };

      notifyListeners();
      return newDraft;
    },

    updateDraft(tempId: string, updates: Partial<Pick<FeedbackDraft, "comment" | "status" | "feedbackType">>): boolean {
      const index = session.drafts.findIndex((d) => d.tempId === tempId);
      if (index === -1) return false;

      const newDrafts = [...session.drafts];
      const current = newDrafts[index];
      if (!current) return false; // Should never happen, but satisfies TS

      // Create updated draft with all required properties
      const updated: FeedbackDraft = {
        tempId: current.tempId,
        orphyId: current.orphyId,
        selector: current.selector,
        boundingBox: current.boundingBox,
        positionInElement: current.positionInElement,
        positionInViewport: current.positionInViewport,
        viewport: current.viewport,
        pageUrl: current.pageUrl,
        feedbackType: updates.feedbackType !== undefined ? updates.feedbackType : current.feedbackType,
        comment: updates.comment !== undefined ? updates.comment : current.comment,
        status: updates.status !== undefined ? updates.status : current.status,
        timestamp: current.timestamp,
        element: current.element,
      };

      newDrafts[index] = updated;
      session = { ...session, drafts: newDrafts };
      notifyListeners();
      return true;
    },

    removeDraft(tempId: string): boolean {
      const filtered = session.drafts.filter((d) => d.tempId !== tempId);
      if (filtered.length === session.drafts.length) return false;

      session = { ...session, drafts: filtered };
      notifyListeners();
      return true;
    },

    markAsSubmitted(): void {
      session = { ...session, submitted: true };
      notifyListeners();
    },

    clearSession(): void {
      session = {
        sessionId: generateSessionId(),
        drafts: [],
        submitted: false,
      };
      notifyListeners();
    },

    subscribe(fn: SessionListener): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  function notifyListeners(): void {
    listeners.forEach((fn) => fn(session));
  }
}

function generateSessionId(): string {
  return `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateTempId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const sessionStore = createSessionStore();
