import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// SHARED VALIDATORS (must match schema.ts)
// =============================================================================

const feedbackTypeValidator = v.union(
  v.literal("bug"),
  v.literal("design"),
  v.literal("content"),
  v.literal("question")
);

const feedbackStatusValidator = v.union(
  v.literal("open"),
  v.literal("treated"),
  v.literal("validated"),
  v.literal("resolved") // @deprecated - Kept for backwards compatibility
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

const authorTypeValidator = v.union(
  v.literal("client"),
  v.literal("agency")
);

const boundingBoxValidator = v.object({
  top: v.number(),
  left: v.number(),
  width: v.number(),
  height: v.number(),
});

const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const viewportValidator = v.object({
  width: v.number(),
  height: v.number(),
  devicePixelRatio: v.number(),
});

const browserInfoValidator = v.object({
  name: v.string(),
  version: v.string(),
});

const osInfoValidator = v.object({
  name: v.string(),
  version: v.string(),
});

const deviceTypeValidator = v.union(
  v.literal("desktop"),
  v.literal("mobile"),
  v.literal("tablet")
);

const screenInfoValidator = v.object({
  width: v.number(),
  height: v.number(),
});

const deviceInfoValidator = v.object({
  browser: browserInfoValidator,
  os: osInfoValidator,
  device: deviceTypeValidator,
  screen: screenInfoValidator,
  touchEnabled: v.boolean(),
  language: v.string(),
});

// =============================================================================
// HELPERS
// =============================================================================

/** Get current user from Clerk identity */
async function getCurrentUser(ctx: { db: any; auth: any }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  return user;
}

/** Check if user has access to a project (owner or workspace member) */
async function hasProjectAccess(
  ctx: { db: any },
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // Direct owner check (backwards compatibility)
  if (project.ownerId === userId) {
    return true;
  }

  // Workspace membership check
  if (project.workspaceId) {
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", userId)
      )
      .first();
    return !!membership;
  }

  return false;
}

/** Get project (public - no auth check) */
async function getProject(ctx: { db: any }, projectId: Id<"projects">) {
  return await ctx.db.get(projectId);
}

// =============================================================================
// QUERIES (Authenticated - Dashboard)
// =============================================================================

/** List feedbacks for a specific project */
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(feedbackStatusValidator),
    feedbackType: v.optional(feedbackTypeValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const hasAccess = await hasProjectAccess(ctx, args.projectId, user._id);
    if (!hasAccess) return [];

    let feedbacksQuery;

    if (args.status !== undefined) {
      feedbacksQuery = ctx.db
        .query("feedbacks")
        .withIndex("by_project_status", (q: any) =>
          q.eq("projectId", args.projectId).eq("status", args.status)
        );
    } else {
      feedbacksQuery = ctx.db
        .query("feedbacks")
        .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId));
    }

    const feedbacks = await feedbacksQuery.order("desc").collect();

    // Filter by feedbackType if specified (in-memory, not indexed)
    if (args.feedbackType !== undefined) {
      return feedbacks.filter((f: any) => f.feedbackType === args.feedbackType);
    }

    return feedbacks;
  },
});

/** List all feedbacks for current user (inbox - across all accessible projects) */
export const listAll = query({
  args: {
    status: v.optional(feedbackStatusValidator),
    feedbackType: v.optional(feedbackTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Get user's workspace memberships
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const workspaceIds = memberships.map((m: any) => m.workspaceId);

    // Get projects from all user's workspaces
    const workspaceProjects = await Promise.all(
      workspaceIds.map(async (workspaceId: any) => {
        return await ctx.db
          .query("projects")
          .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
          .collect();
      })
    );

    // Also get directly owned projects (backwards compatibility)
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q: any) => q.eq("ownerId", user._id))
      .collect();

    // Merge and deduplicate
    const allProjects = [...ownedProjects, ...workspaceProjects.flat()];
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p: any) => [p._id.toString(), p])).values()
    );

    const projectIds = uniqueProjects.map((p: any) => p._id);

    // Get feedbacks for all projects
    const allFeedbacks = [];

    for (const projectId of projectIds) {
      let feedbacksQuery;

      if (args.status !== undefined) {
        feedbacksQuery = ctx.db
          .query("feedbacks")
          .withIndex("by_project_status", (q: any) =>
            q.eq("projectId", projectId).eq("status", args.status)
          );
      } else {
        feedbacksQuery = ctx.db
          .query("feedbacks")
          .withIndex("by_project", (q: any) => q.eq("projectId", projectId));
      }

      const feedbacks = await feedbacksQuery.collect();
      allFeedbacks.push(...feedbacks);
    }

    // Filter by feedbackType if specified
    let filtered = allFeedbacks;
    if (args.feedbackType !== undefined) {
      filtered = filtered.filter((f: any) => f.feedbackType === args.feedbackType);
    }

    // Sort by createdAt descending
    filtered.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // Apply limit if specified
    if (args.limit !== undefined && args.limit > 0) {
      return filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/** Get a single feedback by ID */
export const get = query({
  args: { feedbackId: v.id("feedbacks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return null;

    // Verify ownership via project
    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) return null;

    return feedback;
  },
});

/** Get feedbacks by session ID (for replay) */
export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const feedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .collect();

    // Filter to only feedbacks the user has access to
    const accessibleFeedbacks = [];
    for (const feedback of feedbacks) {
      const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
      if (hasAccess) {
        accessibleFeedbacks.push(feedback);
      }
    }

    return accessibleFeedbacks;
  },
});

/** List feedbacks assigned to current user (My Tasks) */
export const listAssignedToMe = query({
  args: {
    status: v.optional(feedbackStatusValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    let feedbacksQuery = ctx.db
      .query("feedbacks")
      .withIndex("by_assignee", (q: any) => q.eq("assignedTo", user._id));

    const feedbacks = await feedbacksQuery.order("desc").collect();

    // Filter by status if specified
    if (args.status !== undefined) {
      return feedbacks.filter((f: any) => f.status === args.status);
    }

    return feedbacks;
  },
});

/** Count open feedbacks for a workspace (for notification badge) */
export const countOpenByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    // Verify user has access to this workspace
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership) return 0;

    // Get all projects in this workspace
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Count open feedbacks across all projects
    let openCount = 0;
    for (const project of projects) {
      const openFeedbacks = await ctx.db
        .query("feedbacks")
        .withIndex("by_project_status", (q: any) =>
          q.eq("projectId", project._id).eq("status", "open")
        )
        .collect();
      openCount += openFeedbacks.length;
    }

    return openCount;
  },
});

/** Get project stats */
export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const hasAccess = await hasProjectAccess(ctx, args.projectId, user._id);
    if (!hasAccess) return null;

    const allFeedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    const openFeedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project_status", (q: any) =>
        q.eq("projectId", args.projectId).eq("status", "open")
      )
      .collect();

    const treatedFeedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project_status", (q: any) =>
        q.eq("projectId", args.projectId).eq("status", "treated")
      )
      .collect();

    const validatedFeedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project_status", (q: any) =>
        q.eq("projectId", args.projectId).eq("status", "validated")
      )
      .collect();

    // Count by type
    const byType = {
      bug: 0,
      design: 0,
      content: 0,
      question: 0,
    };
    allFeedbacks.forEach((f: any) => {
      if (f.feedbackType in byType) {
        byType[f.feedbackType as keyof typeof byType]++;
      }
    });

    return {
      total: allFeedbacks.length,
      open: openFeedbacks.length,
      treated: treatedFeedbacks.length,
      validated: validatedFeedbacks.length,
      // Keep 'resolved' for backwards compat (treated + validated)
      resolved: treatedFeedbacks.length + validatedFeedbacks.length,
      byType,
    };
  },
});

// =============================================================================
// MUTATIONS (Authenticated - Dashboard)
// =============================================================================

/** Update feedback status */
export const updateStatus = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    status: feedbackStatusValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    await ctx.db.patch(args.feedbackId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.feedbackId;
  },
});

/** Mark feedback as treated (agency has addressed it) with optional note */
export const markAsTreated = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    const now = Date.now();

    await ctx.db.patch(args.feedbackId, {
      status: "treated",
      resolutionNote: args.resolutionNote?.trim() || undefined,
      resolvedBy: user._id,
      resolvedAt: now,
      updatedAt: now,
    });

    return args.feedbackId;
  },
});

/** @deprecated Use markAsTreated instead - kept for backwards compatibility */
export const resolve = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    const now = Date.now();

    await ctx.db.patch(args.feedbackId, {
      status: "treated",
      resolutionNote: args.resolutionNote?.trim() || undefined,
      resolvedBy: user._id,
      resolvedAt: now,
      updatedAt: now,
    });

    return args.feedbackId;
  },
});

/** Reopen a treated/validated feedback (clears all status data) */
export const reopen = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    await ctx.db.patch(args.feedbackId, {
      status: "open",
      resolutionNote: undefined,
      resolvedBy: undefined,
      resolvedAt: undefined,
      validatedAt: undefined,
      updatedAt: Date.now(),
    });

    return args.feedbackId;
  },
});

/** Update feedback priority */
export const updatePriority = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    priority: priorityValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    await ctx.db.patch(args.feedbackId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return args.feedbackId;
  },
});

/** Delete a feedback */
export const remove = mutation({
  args: { feedbackId: v.id("feedbacks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    await ctx.db.delete(args.feedbackId);
    return args.feedbackId;
  },
});

/** Assign feedback to a team member */
export const assignTo = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    assignedTo: v.optional(v.id("users")), // null to unassign
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    // If assigning to someone, verify they have access to the project
    if (args.assignedTo) {
      const assigneeAccess = await hasProjectAccess(
        ctx,
        feedback.projectId,
        args.assignedTo
      );
      if (!assigneeAccess) {
        throw new Error("Assignee does not have access to this project");
      }
    }

    await ctx.db.patch(args.feedbackId, {
      assignedTo: args.assignedTo,
      updatedAt: Date.now(),
    });

    return args.feedbackId;
  },
});

/** Bulk update status */
export const bulkUpdateStatus = mutation({
  args: {
    feedbackIds: v.array(v.id("feedbacks")),
    status: feedbackStatusValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const updated: Id<"feedbacks">[] = [];

    for (const feedbackId of args.feedbackIds) {
      const feedback = await ctx.db.get(feedbackId);
      if (!feedback) continue;

      const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
      if (!hasAccess) continue;

      await ctx.db.patch(feedbackId, {
        status: args.status,
        updatedAt: now,
      });
      updated.push(feedbackId);
    }

    return updated;
  },
});

// =============================================================================
// INTERNAL MUTATIONS (Called from HTTP endpoint - no auth)
// =============================================================================

/** Create feedback from widget (internal - called by HTTP action) */
export const createFromWidget = internalMutation({
  args: {
    projectId: v.id("projects"),
    orphyId: v.string(),
    selector: v.string(),
    boundingBox: boundingBoxValidator,
    positionInElement: positionValidator,
    positionInViewport: positionValidator,
    viewport: viewportValidator,
    pageUrl: v.string(),
    feedbackType: feedbackTypeValidator,
    comment: v.string(),
    // Optional metadata
    authorEmail: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceInfo: v.optional(deviceInfoValidator),
  },
  handler: async (ctx, args) => {
    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if project is active (default to true if not set)
    if (project.isActive === false) {
      throw new Error("Project is not active");
    }

    const now = Date.now();

    // If this is the first feedback for the project, update firstFeedbackAt
    if (!project.firstFeedbackAt) {
      await ctx.db.patch(args.projectId, {
        firstFeedbackAt: now,
        updatedAt: now,
      });
    }

    const feedbackId = await ctx.db.insert("feedbacks", {
      projectId: args.projectId,
      orphyId: args.orphyId,
      selector: args.selector,
      boundingBox: args.boundingBox,
      positionInElement: args.positionInElement,
      positionInViewport: args.positionInViewport,
      viewport: args.viewport,
      pageUrl: args.pageUrl,
      feedbackType: args.feedbackType,
      comment: args.comment,
      status: "open",
      priority: "medium",
      authorEmail: args.authorEmail,
      sessionId: args.sessionId,
      userAgent: args.userAgent,
      deviceInfo: args.deviceInfo,
      createdAt: now,
      updatedAt: now,
    });

    return feedbackId;
  },
});

/** Get a single feedback by ID for replay (internal - called by HTTP action) */
export const getForReplayById = internalQuery({
  args: { feedbackId: v.id("feedbacks") },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return null;

    // Return only fields needed for replay
    return {
      id: feedback._id,
      orphyId: feedback.orphyId,
      selector: feedback.selector,
      boundingBox: feedback.boundingBox,
      positionInElement: feedback.positionInElement,
      positionInViewport: feedback.positionInViewport,
      viewport: feedback.viewport,
      pageUrl: feedback.pageUrl,
      feedbackType: feedback.feedbackType,
      comment: feedback.comment,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };
  },
});

/** Update feedback status from widget replay (internal - called by HTTP action) */
export const updateStatusFromWidget = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    status: feedbackStatusValidator,
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    await ctx.db.patch(args.feedbackId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.feedbackId;
  },
});

/** Mark feedback as treated from widget with optional note (internal - called by HTTP action) */
export const resolveFromWidget = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.feedbackId, {
      status: "treated",
      resolutionNote: args.resolutionNote?.trim() || undefined,
      resolvedAt: now,
      updatedAt: now,
      // Note: no resolvedBy since widget has no authenticated user
    });

    return args.feedbackId;
  },
});

/** Validate feedback from widget (client confirms it's done - internal - called by HTTP action) */
export const validateFromWidget = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Only allow validation if status is "treated"
    if (feedback.status !== "treated") {
      throw new Error("Feedback must be treated before it can be validated");
    }

    const now = Date.now();

    await ctx.db.patch(args.feedbackId, {
      status: "validated",
      validatedAt: now,
      updatedAt: now,
    });

    return args.feedbackId;
  },
});

// =============================================================================
// PUBLIC QUERIES (For replay - no auth, but limited data)
// =============================================================================

/** Get feedbacks for replay by project (public, limited fields) */
export const getForReplay = query({
  args: {
    projectId: v.id("projects"),
    pageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    let feedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    // Filter by pageUrl if specified
    if (args.pageUrl) {
      feedbacks = feedbacks.filter((f: any) => f.pageUrl === args.pageUrl);
    }

    // Return only fields needed for replay (hide sensitive data)
    return feedbacks.map((f: any) => ({
      id: f._id,
      orphyId: f.orphyId,
      selector: f.selector,
      boundingBox: f.boundingBox,
      positionInElement: f.positionInElement,
      positionInViewport: f.positionInViewport,
      viewport: f.viewport,
      pageUrl: f.pageUrl,
      feedbackType: f.feedbackType,
      comment: f.comment,
      authorType: f.authorType || "client",
      authorName: f.authorName,
      status: f.status,
      createdAt: f.createdAt,
    }));
  },
});

// =============================================================================
// REPLIES - Thread messages on feedbacks
// =============================================================================

/** List replies for a feedback (authenticated - Dashboard) */
export const listReplies = query({
  args: {
    feedbackId: v.id("feedbacks"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Verify access to the feedback's project
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return [];

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) return [];

    const replies = await ctx.db
      .query("replies")
      .withIndex("by_feedback", (q: any) => q.eq("feedbackId", args.feedbackId))
      .order("asc")
      .collect();

    return replies;
  },
});

/** Create a reply (authenticated - Dashboard, agency member) */
export const createReply = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Verify access to the feedback's project
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Feedback not found");

    const hasAccess = await hasProjectAccess(ctx, feedback.projectId, user._id);
    if (!hasAccess) throw new Error("Not authorized");

    const replyId = await ctx.db.insert("replies", {
      feedbackId: args.feedbackId,
      authorType: "agency",
      authorId: user._id,
      authorName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      authorEmail: user.email,
      content: args.content.trim(),
      createdAt: Date.now(),
    });

    // Update feedback's updatedAt
    await ctx.db.patch(args.feedbackId, {
      updatedAt: Date.now(),
    });

    return replyId;
  },
});

/** Create a reply from widget (internal - client reply) */
export const createReplyFromWidget = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    content: v.string(),
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify feedback exists
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const replyId = await ctx.db.insert("replies", {
      feedbackId: args.feedbackId,
      authorType: "client",
      authorName: args.authorName,
      authorEmail: args.authorEmail,
      content: args.content.trim(),
      createdAt: Date.now(),
    });

    // Update feedback's updatedAt
    await ctx.db.patch(args.feedbackId, {
      updatedAt: Date.now(),
    });

    return replyId;
  },
});

/** Get replies for replay (internal - limited fields for widget) */
export const getRepliesForReplay = internalQuery({
  args: {
    feedbackId: v.id("feedbacks"),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("replies")
      .withIndex("by_feedback", (q: any) => q.eq("feedbackId", args.feedbackId))
      .order("asc")
      .collect();

    // Return only fields needed for widget display
    return replies.map((r: any) => ({
      id: r._id,
      authorType: r.authorType,
      authorName: r.authorName,
      content: r.content,
      createdAt: r.createdAt,
    }));
  },
});

/** Get feedbacks for review mode (internal - called by HTTP action for widget review) */
export const getForReviewByProject = internalQuery({
  args: {
    projectId: v.id("projects"),
    pageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    let feedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    // Filter by pageUrl if specified
    if (args.pageUrl) {
      feedbacks = feedbacks.filter((f: any) => f.pageUrl === args.pageUrl);
    }

    // Return fields needed for review mode
    return feedbacks.map((f: any) => ({
      id: f._id,
      orphyId: f.orphyId,
      selector: f.selector,
      boundingBox: f.boundingBox,
      positionInElement: f.positionInElement,
      positionInViewport: f.positionInViewport,
      viewport: f.viewport,
      pageUrl: f.pageUrl,
      feedbackType: f.feedbackType,
      comment: f.comment,
      authorType: f.authorType || "client",
      authorName: f.authorName,
      authorEmail: f.authorEmail,
      status: f.status,
      createdAt: f.createdAt,
    }));
  },
});
