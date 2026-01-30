/**
 * Threads module - Fetch and manage feedbacks/replies for the current page
 * Allows clients to see conversations on their feedbacks
 */

import type { Feedback } from "./state";

// =============================================================================
// TYPES
// =============================================================================

export interface Reply {
  id: string;
  authorType: "client" | "agency";
  authorName?: string;
  content: string;
  createdAt: number;
}

export interface FeedbackThread extends Feedback {
  replies: Reply[];
}

export interface ThreadsConfig {
  apiUrl: string;
  projectId: string;
}

// =============================================================================
// STATE
// =============================================================================

let config: ThreadsConfig | null = null;
let threadsCache: FeedbackThread[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

// =============================================================================
// PUBLIC API
// =============================================================================

export function setThreadsConfig(threadsConfig: ThreadsConfig): void {
  config = threadsConfig;
}

export function getThreadsConfig(): ThreadsConfig | null {
  return config;
}

/**
 * Fetch all feedbacks for the current page with their replies
 */
export async function fetchThreadsForPage(): Promise<FeedbackThread[]> {
  if (!config) {
    console.error("Orphy: Threads config not set");
    return [];
  }

  // Use cache if recent
  const now = Date.now();
  if (threadsCache.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return threadsCache;
  }

  // Get current page URL (without query params)
  const urlParts = window.location.href.split("?");
  const pageUrl = urlParts[0] ?? window.location.href;

  try {
    // Fetch feedbacks for this project/page
    const response = await fetch(
      `${config.apiUrl}/project/${config.projectId}?pageUrl=${encodeURIComponent(pageUrl)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.status}`);
    }

    const { feedbacks } = (await response.json()) as { feedbacks: Feedback[] };

    // Fetch replies for each feedback
    const threads = await Promise.all(
      feedbacks.map(async (feedback) => {
        const replies = await fetchReplies(feedback.id);
        return { ...feedback, replies };
      })
    );

    // Update cache
    threadsCache = threads;
    lastFetchTime = now;

    return threads;
  } catch (error) {
    console.error("Orphy: Failed to fetch threads", error);
    return [];
  }
}

/**
 * Get cached threads (doesn't fetch)
 */
export function getCachedThreads(): FeedbackThread[] {
  return threadsCache;
}

/**
 * Check if there are any threads for this page
 */
export function hasThreads(): boolean {
  return threadsCache.length > 0;
}

/**
 * Get total reply count (for notification badge)
 */
export function getTotalReplyCount(): number {
  return threadsCache.reduce((sum, thread) => sum + thread.replies.length, 0);
}

/**
 * Clear the cache (e.g., when page changes)
 */
export function clearThreadsCache(): void {
  threadsCache = [];
  lastFetchTime = 0;
}

/**
 * Create a reply to a feedback
 */
export async function createReply(
  feedbackId: string,
  content: string
): Promise<Reply | null> {
  if (!config) return null;

  try {
    // Use replay API for replies
    const replayApiUrl = config.apiUrl.replace("/review", "/replay");
    const response = await fetch(`${replayApiUrl}/${feedbackId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create reply: ${response.status}`);
    }

    const { replyId } = (await response.json()) as { replyId: string };

    const newReply: Reply = {
      id: replyId,
      authorType: "client", // From widget, it's always client
      content,
      createdAt: Date.now(),
    };

    // Update cache
    const thread = threadsCache.find((t) => t.id === feedbackId);
    if (thread) {
      thread.replies.push(newReply);
    }

    return newReply;
  } catch (error) {
    console.error("Orphy: Failed to create reply", error);
    return null;
  }
}

/**
 * Validate a feedback (client confirms the fix is good)
 * Only works when status is "treated"
 */
export async function validateFeedback(feedbackId: string): Promise<boolean> {
  if (!config) return false;

  try {
    const replayApiUrl = config.apiUrl.replace("/review", "/replay");
    const response = await fetch(`${replayApiUrl}/${feedbackId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "validated" }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to validate: ${response.status}`);
    }

    // Update cache
    const thread = threadsCache.find((t) => t.id === feedbackId);
    if (thread) {
      thread.status = "validated";
    }

    return true;
  } catch (error) {
    console.error("Orphy: Failed to validate feedback", error);
    return false;
  }
}

// =============================================================================
// PRIVATE HELPERS
// =============================================================================

async function fetchReplies(feedbackId: string): Promise<Reply[]> {
  if (!config) return [];

  try {
    // Use replay API for replies
    const replayApiUrl = config.apiUrl.replace("/review", "/replay");
    const response = await fetch(`${replayApiUrl}/${feedbackId}/replies`);
    if (!response.ok) return [];
    const { replies } = (await response.json()) as { replies: Reply[] };
    return replies;
  } catch {
    return [];
  }
}
