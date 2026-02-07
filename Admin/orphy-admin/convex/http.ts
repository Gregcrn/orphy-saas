import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Session-Id, X-User-Agent",
  "Access-Control-Max-Age": "86400",
} as const;

function corsResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function corsErrorResponse(error: string, status: number = 400) {
  return corsResponse({ success: false, error }, status);
}

// =============================================================================
// TYPE DEFINITIONS (match widget format)
// =============================================================================

interface DeviceInfo {
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: "desktop" | "mobile" | "tablet";
  screen: {
    width: number;
    height: number;
  };
  touchEnabled: boolean;
  language: string;
}

interface FeedbackPayload {
  orphyId: string;
  selector: string;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  positionInElement: {
    x: number;
    y: number;
  };
  positionInViewport: {
    x: number;
    y: number;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  pageUrl: string;
  feedbackType: "bug" | "design" | "content" | "question";
  comment: string;
  // Optional device info
  deviceInfo?: DeviceInfo;
}

interface BatchRequest {
  projectId: string;
  feedbacks: FeedbackPayload[];
  // Optional metadata
  sessionId?: string;
  authorEmail?: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function isValidFeedbackType(type: unknown): type is "bug" | "design" | "content" | "question" {
  return type === "bug" || type === "design" || type === "content" || type === "question";
}

function isValidBoundingBox(box: unknown): box is FeedbackPayload["boundingBox"] {
  if (!box || typeof box !== "object") return false;
  const b = box as Record<string, unknown>;
  return (
    typeof b.top === "number" &&
    typeof b.left === "number" &&
    typeof b.width === "number" &&
    typeof b.height === "number"
  );
}

function isValidPosition(pos: unknown): pos is { x: number; y: number } {
  if (!pos || typeof pos !== "object") return false;
  const p = pos as Record<string, unknown>;
  return typeof p.x === "number" && typeof p.y === "number";
}

function isValidViewport(vp: unknown): vp is FeedbackPayload["viewport"] {
  if (!vp || typeof vp !== "object") return false;
  const v = vp as Record<string, unknown>;
  return (
    typeof v.width === "number" &&
    typeof v.height === "number" &&
    typeof v.devicePixelRatio === "number"
  );
}

function isValidDeviceType(type: unknown): type is "desktop" | "mobile" | "tablet" {
  return type === "desktop" || type === "mobile" || type === "tablet";
}

function isValidDeviceInfo(info: unknown): info is DeviceInfo {
  if (!info || typeof info !== "object") return false;
  const d = info as Record<string, unknown>;

  // Validate browser
  if (!d.browser || typeof d.browser !== "object") return false;
  const browser = d.browser as Record<string, unknown>;
  if (typeof browser.name !== "string" || typeof browser.version !== "string") return false;

  // Validate OS
  if (!d.os || typeof d.os !== "object") return false;
  const os = d.os as Record<string, unknown>;
  if (typeof os.name !== "string" || typeof os.version !== "string") return false;

  // Validate device type
  if (!isValidDeviceType(d.device)) return false;

  // Validate screen
  if (!d.screen || typeof d.screen !== "object") return false;
  const screen = d.screen as Record<string, unknown>;
  if (typeof screen.width !== "number" || typeof screen.height !== "number") return false;

  // Validate other fields
  if (typeof d.touchEnabled !== "boolean") return false;
  if (typeof d.language !== "string") return false;

  return true;
}

function validateFeedback(feedback: unknown, index: number): { valid: true; data: FeedbackPayload } | { valid: false; error: string } {
  if (!feedback || typeof feedback !== "object") {
    return { valid: false, error: `Feedback ${index}: invalid format` };
  }

  const f = feedback as Record<string, unknown>;

  if (typeof f.orphyId !== "string" || !f.orphyId) {
    return { valid: false, error: `Feedback ${index}: missing orphyId` };
  }
  if (typeof f.selector !== "string" || !f.selector) {
    return { valid: false, error: `Feedback ${index}: missing selector` };
  }
  if (!isValidBoundingBox(f.boundingBox)) {
    return { valid: false, error: `Feedback ${index}: invalid boundingBox` };
  }
  if (!isValidPosition(f.positionInElement)) {
    return { valid: false, error: `Feedback ${index}: invalid positionInElement` };
  }
  if (!isValidPosition(f.positionInViewport)) {
    return { valid: false, error: `Feedback ${index}: invalid positionInViewport` };
  }
  if (!isValidViewport(f.viewport)) {
    return { valid: false, error: `Feedback ${index}: invalid viewport` };
  }
  if (typeof f.pageUrl !== "string" || !f.pageUrl) {
    return { valid: false, error: `Feedback ${index}: missing pageUrl` };
  }
  if (!isValidFeedbackType(f.feedbackType)) {
    return { valid: false, error: `Feedback ${index}: invalid feedbackType (must be bug|design|content|question)` };
  }
  if (typeof f.comment !== "string") {
    return { valid: false, error: `Feedback ${index}: missing comment` };
  }

  // Validate deviceInfo if provided (optional but must be valid if present)
  let validDeviceInfo: DeviceInfo | undefined = undefined;
  if (f.deviceInfo !== undefined) {
    if (!isValidDeviceInfo(f.deviceInfo)) {
      return { valid: false, error: `Feedback ${index}: invalid deviceInfo format` };
    }
    validDeviceInfo = f.deviceInfo as DeviceInfo;
  }

  return {
    valid: true,
    data: {
      orphyId: f.orphyId,
      selector: f.selector,
      boundingBox: f.boundingBox,
      positionInElement: f.positionInElement,
      positionInViewport: f.positionInViewport,
      viewport: f.viewport,
      pageUrl: f.pageUrl,
      feedbackType: f.feedbackType,
      comment: f.comment,
      deviceInfo: validDeviceInfo,
    },
  };
}

// =============================================================================
// BATCH ENDPOINT (Widget submits all feedbacks at once)
// =============================================================================

http.route({
  path: "/api/feedback/batch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse request body
      const body = await request.json() as BatchRequest;

      // Validate projectId
      if (!body.projectId || typeof body.projectId !== "string") {
        return corsErrorResponse("Missing or invalid projectId");
      }

      // Validate feedbacks array
      if (!Array.isArray(body.feedbacks) || body.feedbacks.length === 0) {
        return corsErrorResponse("Missing or empty feedbacks array");
      }

      // Limit batch size to prevent abuse
      const MAX_BATCH_SIZE = 50;
      if (body.feedbacks.length > MAX_BATCH_SIZE) {
        return corsErrorResponse(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
      }

      // Get optional metadata from headers or body
      const sessionId = body.sessionId || request.headers.get("X-Session-Id") || undefined;
      const userAgent = request.headers.get("User-Agent") || undefined;
      const authorEmail = body.authorEmail || undefined;

      // Validate all feedbacks first
      const validatedFeedbacks: FeedbackPayload[] = [];
      for (let i = 0; i < body.feedbacks.length; i++) {
        const result = validateFeedback(body.feedbacks[i], i);
        if (!result.valid) {
          return corsErrorResponse(result.error);
        }
        validatedFeedbacks.push(result.data);
      }

      // Create all feedbacks
      const createdFeedbacks: { id: string; orphyId: string }[] = [];
      const errors: string[] = [];

      for (const feedback of validatedFeedbacks) {
        try {
          const feedbackId = await ctx.runMutation(internal.feedbacks.createFromWidget, {
            projectId: body.projectId as Id<"projects">,
            orphyId: feedback.orphyId,
            selector: feedback.selector,
            boundingBox: feedback.boundingBox,
            positionInElement: feedback.positionInElement,
            positionInViewport: feedback.positionInViewport,
            viewport: feedback.viewport,
            pageUrl: feedback.pageUrl,
            feedbackType: feedback.feedbackType,
            comment: feedback.comment,
            sessionId,
            userAgent,
            authorEmail,
            deviceInfo: feedback.deviceInfo,
          });

          createdFeedbacks.push({
            id: feedbackId,
            orphyId: feedback.orphyId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to create feedback for ${feedback.orphyId}: ${message}`);
        }
      }

      // If all failed, return error
      if (createdFeedbacks.length === 0) {
        return corsErrorResponse(errors.join("; "), 500);
      }

      // Return success with created feedback IDs
      return corsResponse({
        success: true,
        feedbacks: createdFeedbacks,
        // Include errors if some failed (partial success)
        ...(errors.length > 0 && { warnings: errors }),
      }, 201);

    } catch (error) {
      console.error("Error in batch feedback endpoint:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// =============================================================================
// SINGLE FEEDBACK ENDPOINT (Alternative for individual submissions)
// =============================================================================

http.route({
  path: "/api/feedback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as FeedbackPayload & { projectId: string };

      // Validate projectId
      if (!body.projectId || typeof body.projectId !== "string") {
        return corsErrorResponse("Missing or invalid projectId");
      }

      // Validate feedback
      const result = validateFeedback(body, 0);
      if (!result.valid) {
        return corsErrorResponse(result.error);
      }

      // Get optional metadata
      const sessionId = request.headers.get("X-Session-Id") || undefined;
      const userAgent = request.headers.get("User-Agent") || undefined;

      // Create feedback
      const feedbackId = await ctx.runMutation(internal.feedbacks.createFromWidget, {
        projectId: body.projectId as Id<"projects">,
        orphyId: result.data.orphyId,
        selector: result.data.selector,
        boundingBox: result.data.boundingBox,
        positionInElement: result.data.positionInElement,
        positionInViewport: result.data.positionInViewport,
        viewport: result.data.viewport,
        pageUrl: result.data.pageUrl,
        feedbackType: result.data.feedbackType,
        comment: result.data.comment,
        sessionId,
        userAgent,
        deviceInfo: result.data.deviceInfo,
      });

      return corsResponse({
        success: true,
        feedbackId,
      }, 201);

    } catch (error) {
      console.error("Error in single feedback endpoint:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// =============================================================================
// REPLAY ENDPOINTS (Public - for widget replay mode)
// Using pathPrefix for dynamic feedbackId routing
// =============================================================================

// PATCH /api/replay/{feedbackId}/status - Update feedback status
// Supports: open, treated, validated
http.route({
  pathPrefix: "/api/replay/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    try {
      // Extract feedbackId from URL path like /api/replay/{feedbackId}/status
      const url = new URL(request.url);
      const pathAfterPrefix = url.pathname.replace("/api/replay/", "");
      const feedbackId = pathAfterPrefix.split("/")[0];

      if (!feedbackId) {
        return corsErrorResponse("Missing feedbackId", 400);
      }

      // Parse body
      const body = await request.json() as { status: string };

      const validStatuses = ["open", "treated", "validated", "resolved"]; // Keep "resolved" for backwards compat
      if (!body.status || !validStatuses.includes(body.status)) {
        return corsErrorResponse("Invalid status (must be 'open', 'treated', or 'validated')", 400);
      }

      // Handle status transitions
      if (body.status === "treated" || body.status === "resolved") {
        // Agency marks as treated (resolved is alias for treated for backwards compat)
        await ctx.runMutation(internal.feedbacks.resolveFromWidget, {
          feedbackId: feedbackId as Id<"feedbacks">,
        });
      } else if (body.status === "validated") {
        // Client validates (requires status to be "treated")
        await ctx.runMutation(internal.feedbacks.validateFromWidget, {
          feedbackId: feedbackId as Id<"feedbacks">,
        });
      } else {
        // Reopen (status = "open")
        await ctx.runMutation(internal.feedbacks.updateStatusFromWidget, {
          feedbackId: feedbackId as Id<"feedbacks">,
          status: "open",
        });
      }

      return corsResponse({ success: true });
    } catch (error) {
      console.error("Error updating feedback status:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// GET /api/replay/{feedbackId}/replies - Get replies for a feedback
http.route({
  pathPrefix: "/api/replay/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.replace("/api/replay/", "").split("/");
      const feedbackId = pathParts[0];
      const resource = pathParts[1];

      // If requesting replies
      if (resource === "replies" && feedbackId) {
        const replies = await ctx.runQuery(internal.feedbacks.getRepliesForReplay, {
          feedbackId: feedbackId as Id<"feedbacks">,
        });
        return corsResponse({ replies });
      }

      // Otherwise, get the feedback itself (existing behavior)
      if (feedbackId && !resource) {
        const feedback = await ctx.runQuery(internal.feedbacks.getForReplayById, {
          feedbackId: feedbackId as Id<"feedbacks">,
        });

        if (!feedback) {
          return corsErrorResponse("Feedback not found", 404);
        }

        return corsResponse({ feedback });
      }

      return corsErrorResponse("Invalid request", 400);
    } catch (error) {
      console.error("Error in replay GET:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// POST /api/replay/{feedbackId}/replies - Create a reply (client)
http.route({
  pathPrefix: "/api/replay/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.replace("/api/replay/", "").split("/");
      const feedbackId = pathParts[0];
      const resource = pathParts[1];

      if (resource !== "replies" || !feedbackId) {
        return corsErrorResponse("Invalid endpoint", 400);
      }

      const body = await request.json() as {
        content: string;
        authorName?: string;
        authorEmail?: string;
      };

      if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
        return corsErrorResponse("Missing or empty content", 400);
      }

      const replyId = await ctx.runMutation(internal.feedbacks.createReplyFromWidget, {
        feedbackId: feedbackId as Id<"feedbacks">,
        content: body.content,
        authorName: body.authorName,
        authorEmail: body.authorEmail,
      });

      return corsResponse({ success: true, replyId }, 201);
    } catch (error) {
      console.error("Error creating reply:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// CORS preflight for replay endpoints
http.route({
  pathPrefix: "/api/replay/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      },
    });
  }),
});

// =============================================================================
// REVIEW MODE ENDPOINTS (For agency review on client sites)
// =============================================================================

// GET /api/review/project/{projectId}?pageUrl=... - Get feedbacks for review mode
http.route({
  pathPrefix: "/api/review/project/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const projectId = url.pathname.replace("/api/review/project/", "").split("/")[0];
      const pageUrl = url.searchParams.get("pageUrl") || undefined;

      if (!projectId) {
        return corsErrorResponse("Missing projectId", 400);
      }

      const feedbacks = await ctx.runQuery(internal.feedbacks.getForReviewByProject, {
        projectId: projectId as Id<"projects">,
        pageUrl,
      });

      return corsResponse({ feedbacks });
    } catch (error) {
      console.error("Error in review GET:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

// CORS preflight for review endpoints
http.route({
  pathPrefix: "/api/review/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }),
});

// =============================================================================
// CORS PREFLIGHT HANDLERS
// =============================================================================

http.route({
  path: "/api/feedback/batch",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

http.route({
  path: "/api/feedback",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

// =============================================================================
// DEMO SEED ENDPOINT
// =============================================================================

http.route({
  path: "/api/seed-demo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as {
        projectId: string;
        pageUrl: string;
      };

      if (!body.projectId || !body.pageUrl) {
        return corsErrorResponse("Missing projectId or pageUrl");
      }

      const result = await ctx.runMutation(internal.seed.seedDemoData, {
        projectId: body.projectId as Id<"projects">,
        pageUrl: body.pageUrl,
      });

      return corsResponse(result);
    } catch (error) {
      console.error("Error seeding demo data:", error);
      const message =
        error instanceof Error ? error.message : "Internal server error";
      return corsErrorResponse(message, 500);
    }
  }),
});

http.route({
  path: "/api/seed-demo",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return corsResponse({
      status: "ok",
      timestamp: Date.now(),
      version: "1.0.0",
    });
  }),
});

export default http;
