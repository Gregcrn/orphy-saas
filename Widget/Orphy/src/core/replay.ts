/**
 * Replay mode - Navigate to and highlight feedback elements
 */

import type { Feedback } from "./state";
import { showReplayOverlay, hideReplayOverlay } from "../ui/replay-overlay";

let replayActive = false;

export interface ReplayConfig {
  apiUrl: string;
}

let config: ReplayConfig | null = null;

export function setReplayConfig(replayConfig: ReplayConfig): void {
  config = replayConfig;
}

export async function enterReplayMode(feedbackId: string): Promise<void> {
  if (!config) {
    console.error("Orphy: Replay config not set");
    return;
  }

  replayActive = true;

  try {
    // Fetch the feedback from API
    const response = await fetch(`${config.apiUrl}/${feedbackId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.status}`);
    }

    const { feedback } = (await response.json()) as { feedback: Feedback };

    // Wait for page to be fully loaded (images, etc.) before positioning
    await waitForPageLoad();

    // Resolve element using cascade: orphyId → selector
    let element = document.querySelector<HTMLElement>(
      `[data-orphy-id="${feedback.orphyId}"]`
    );

    if (!element) {
      element = document.querySelector<HTMLElement>(feedback.selector);
    }

    if (!element) {
      showFallbackMessage("Element not found on this page");
      return;
    }

    // Scroll to element
    element.scrollIntoView({ block: "center", behavior: "instant" });

    // Show replay overlay with feedback info
    showReplayOverlay(element, feedback, handleClose, handleResolve);
  } catch (error) {
    console.error("Orphy: Failed to enter replay mode", error);
    showFallbackMessage("Failed to load feedback");
  }
}

/**
 * Wait for page to be fully loaded (including images)
 */
function waitForPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
    } else {
      window.addEventListener("load", () => resolve(), { once: true });
    }
  });
}

export function exitReplayMode(): void {
  replayActive = false;
  hideReplayOverlay();
  removeFallbackMessage();

  // Clean URL param without reload
  const url = new URL(window.location.href);
  url.searchParams.delete("orphy_replay");
  window.history.replaceState({}, "", url.toString());
}

export function isReplayActive(): boolean {
  return replayActive;
}

function handleClose(): void {
  exitReplayMode();
}

async function handleResolve(feedbackId: string, note?: string): Promise<void> {
  if (!config) return;

  try {
    const response = await fetch(`${config.apiUrl}/${feedbackId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", resolutionNote: note }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.status}`);
    }

    exitReplayMode();
  } catch (error) {
    console.error("Orphy: Failed to mark as resolved", error);
  }
}

// Fallback message UI
let fallbackEl: HTMLDivElement | null = null;

function showFallbackMessage(message: string): void {
  removeFallbackMessage();

  fallbackEl = document.createElement("div");
  fallbackEl.className = "orphy-fallback";
  Object.assign(fallbackEl.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "999999",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    padding: "24px",
    textAlign: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  });

  const text = document.createElement("p");
  text.textContent = message;
  text.style.margin = "0 0 16px";
  text.style.fontSize = "16px";
  text.style.color = "#374151";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  Object.assign(closeBtn.style, {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  });
  closeBtn.onclick = () => exitReplayMode();

  fallbackEl.appendChild(text);
  fallbackEl.appendChild(closeBtn);
  document.body.appendChild(fallbackEl);
}

function removeFallbackMessage(): void {
  if (fallbackEl) {
    fallbackEl.remove();
    fallbackEl = null;
  }
}
