import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// SHARED VALIDATORS
// =============================================================================

/** Feedback type - matches widget's FeedbackType */
const feedbackType = v.union(
  v.literal("bug"),
  v.literal("design"),
  v.literal("content"),
  v.literal("question")
);

/** Feedback status */
const feedbackStatus = v.union(v.literal("open"), v.literal("resolved"));

/** Priority levels */
const priorityLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

/** Bounding box - element dimensions at capture time */
const boundingBox = v.object({
  top: v.number(),
  left: v.number(),
  width: v.number(),
  height: v.number(),
});

/** 2D position */
const position = v.object({
  x: v.number(),
  y: v.number(),
});

/** Viewport info at capture time */
const viewport = v.object({
  width: v.number(),
  height: v.number(),
  devicePixelRatio: v.number(),
});

/** Browser info */
const browserInfo = v.object({
  name: v.string(), // Chrome, Safari, Firefox, Edge, etc.
  version: v.string(),
});

/** Operating system info */
const osInfo = v.object({
  name: v.string(), // Windows, macOS, iOS, Android, Linux
  version: v.string(),
});

/** Device type */
const deviceType = v.union(
  v.literal("desktop"),
  v.literal("mobile"),
  v.literal("tablet")
);

/** Screen dimensions */
const screenInfo = v.object({
  width: v.number(),
  height: v.number(),
});

/** Complete device information for debugging */
const deviceInfo = v.object({
  browser: browserInfo,
  os: osInfo,
  device: deviceType,
  screen: screenInfo,
  touchEnabled: v.boolean(),
  language: v.string(), // Browser language (fr-FR, en-US, etc.)
});

// =============================================================================
// WORKSPACE & TEAM VALIDATORS
// =============================================================================

/** Workspace plan tiers */
const workspacePlan = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("business"),
  v.literal("enterprise")
);

/** Workspace member roles */
const memberRole = v.union(
  v.literal("owner"), // Full access + billing
  v.literal("admin"), // Full access, no billing
  v.literal("member"), // Can view/edit feedbacks
  v.literal("viewer") // Read-only access
);

/** Invitation roles (excludes owner - can't invite owners) */
const invitationRole = v.union(
  v.literal("admin"),
  v.literal("member"),
  v.literal("viewer")
);

/** Invitation status */
const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("expired"),
  v.literal("revoked")
);

// =============================================================================
// SCHEMA
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // USERS (synced from Clerk via webhook)
  // ---------------------------------------------------------------------------
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // ---------------------------------------------------------------------------
  // WORKSPACES (billing entity, contains team)
  // ---------------------------------------------------------------------------
  workspaces: defineTable({
    /** Workspace display name */
    name: v.string(),
    /** URL-friendly identifier (optional, for future /workspace/[slug] routes) */
    slug: v.optional(v.string()),
    /** User who created the workspace (responsible for billing) */
    ownerId: v.id("users"),
    /** Subscription plan */
    plan: v.optional(workspacePlan),
    /** Maximum number of seats allowed (based on plan) */
    maxSeats: v.optional(v.number()),
    /** Stripe customer ID (for billing integration) */
    stripeCustomerId: v.optional(v.string()),
    /** Stripe subscription ID */
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),

  // ---------------------------------------------------------------------------
  // WORKSPACE MEMBERS (links users to workspaces with roles)
  // ---------------------------------------------------------------------------
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    /** Member's role in this workspace */
    role: memberRole,
    /** Who invited this member (null if owner/founder) */
    invitedBy: v.optional(v.id("users")),
    /** When the invitation was sent */
    invitedAt: v.optional(v.number()),
    /** When the user joined the workspace */
    joinedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // ---------------------------------------------------------------------------
  // WORKSPACE INVITATIONS (pending invites to join a workspace)
  // ---------------------------------------------------------------------------
  workspaceInvitations: defineTable({
    /** Workspace the invitation is for */
    workspaceId: v.id("workspaces"),
    /** Email of the invited person */
    email: v.string(),
    /** Role to assign when accepted */
    role: invitationRole,
    /** Unique token for the invitation link */
    token: v.string(),
    /** User who sent the invitation */
    invitedBy: v.id("users"),
    /** Invitation status */
    status: invitationStatus,
    /** When the invitation expires (7 days from creation) */
    expiresAt: v.number(),
    /** When the invitation was accepted (if accepted) */
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // ---------------------------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------------------------
  projects: defineTable({
    name: v.string(),
    /** Website URL where widget is installed */
    url: v.string(),
    /** Workspace this project belongs to */
    workspaceId: v.optional(v.id("workspaces")),
    /** @deprecated Use workspaceId instead. Kept for backwards compatibility. */
    ownerId: v.id("users"),
    /** Allowed domains for CORS (optional, defaults to project URL) */
    allowedDomains: v.optional(v.array(v.string())),
    /** Whether project is active */
    isActive: v.optional(v.boolean()),
    /** Timestamp when onboarding setup was completed */
    setupCompletedAt: v.optional(v.number()),
    /** Timestamp when first feedback was received (widget installation verified) */
    firstFeedbackAt: v.optional(v.number()),

    // -------------------------------------------------------------------------
    // Client Contact (for review rounds & recap emails)
    // -------------------------------------------------------------------------
    /** Client contact name (e.g., "Marie Dupont" or "Interne") */
    clientName: v.optional(v.string()),
    /** Client contact email */
    clientEmail: v.optional(v.string()),
    /** Client company name (e.g., "Acme Corp" or "Interne") */
    clientCompany: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_workspace", ["workspaceId"]),

  // ---------------------------------------------------------------------------
  // FEEDBACKS
  // ---------------------------------------------------------------------------
  feedbacks: defineTable({
    /** Reference to parent project - REQUIRED */
    projectId: v.id("projects"),

    // -------------------------------------------------------------------------
    // Element Identification (for replay functionality)
    // -------------------------------------------------------------------------
    /** Stable identifier injected on DOM element by widget */
    orphyId: v.string(),
    /** CSS selector (best effort - may break if DOM changes) */
    selector: v.string(),

    // -------------------------------------------------------------------------
    // Position Data (for visual replay)
    // -------------------------------------------------------------------------
    /** Element bounding box at capture time (viewport-relative) */
    boundingBox: boundingBox,
    /** Click position relative to element's top-left corner */
    positionInElement: position,
    /** Click position relative to viewport */
    positionInViewport: position,
    /** Viewport dimensions at capture time */
    viewport: viewport,

    // -------------------------------------------------------------------------
    // Content
    // -------------------------------------------------------------------------
    /** Full page URL where feedback was captured */
    pageUrl: v.string(),
    /** Type of feedback */
    feedbackType: feedbackType,
    /** User's comment */
    comment: v.string(),

    // -------------------------------------------------------------------------
    // Status & Management
    // -------------------------------------------------------------------------
    status: feedbackStatus,
    priority: priorityLevel,
    /** Team member assigned to this feedback */
    assignedTo: v.optional(v.id("users")),

    // -------------------------------------------------------------------------
    // Resolution (when status = "resolved")
    // -------------------------------------------------------------------------
    /** Note explaining what was done to resolve */
    resolutionNote: v.optional(v.string()),
    /** Who resolved the feedback */
    resolvedBy: v.optional(v.id("users")),
    /** When it was resolved */
    resolvedAt: v.optional(v.number()),

    // -------------------------------------------------------------------------
    // Metadata (optional)
    // -------------------------------------------------------------------------
    /** Email of person who left feedback (if provided) */
    authorEmail: v.optional(v.string()),
    /** Widget session ID for grouping feedbacks */
    sessionId: v.optional(v.string()),
    /** Raw browser user agent (fallback) */
    userAgent: v.optional(v.string()),
    /** Structured device/browser information for debugging */
    deviceInfo: v.optional(deviceInfo),

    // -------------------------------------------------------------------------
    // Timestamps
    // -------------------------------------------------------------------------
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_orphyId", ["projectId", "orphyId"]) // For replay: find feedback by element
    .index("by_session", ["sessionId"]) // Group feedbacks by session
    .index("by_assignee", ["assignedTo"]), // Filter by assigned user ("My tasks")
});
