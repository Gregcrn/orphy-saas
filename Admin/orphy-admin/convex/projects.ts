import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get the current user's Convex ID from their Clerk ID
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

// Get user's default workspace (first one they own)
async function getDefaultWorkspace(ctx: { db: any }, userId: Id<"users">) {
  // Find a workspace where user is owner
  const ownerMembership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("role"), "owner"))
    .first();

  if (ownerMembership) {
    return await ctx.db.get(ownerMembership.workspaceId);
  }

  // Fallback: first workspace they're a member of
  const anyMembership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (anyMembership) {
    return await ctx.db.get(anyMembership.workspaceId);
  }

  return null;
}

// Check if user has access to a project (owner or workspace member)
async function hasProjectAccess(
  ctx: { db: any },
  project: { ownerId: Id<"users">; workspaceId?: Id<"workspaces"> },
  userId: Id<"users">
): Promise<boolean> {
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

// List all projects the user has access to (owned or via workspace)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get user's workspace memberships
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const workspaceIds = memberships.map((m) => m.workspaceId);

    // Get projects from all user's workspaces
    const workspaceProjects = await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        return await ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .collect();
      })
    );

    // Also get directly owned projects (backwards compatibility)
    const ownedProjects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Merge and deduplicate
    const allProjects = [...ownedProjects, ...workspaceProjects.flat()];
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p._id, p])).values()
    );

    // Sort by creation date (newest first)
    return uniqueProjects.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a single project by ID
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check access (owner or workspace member)
    const canAccess = await hasProjectAccess(ctx, project, user._id);
    if (!canAccess) {
      return null;
    }

    return project;
  },
});

// Create a new project
export const create = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    // Client contact info
    clientName: v.string(),
    clientEmail: v.string(),
    clientCompany: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Use provided workspaceId or get user's default workspace
    let workspaceId = args.workspaceId;
    if (!workspaceId) {
      const defaultWorkspace = await getDefaultWorkspace(ctx, user._id);
      workspaceId = defaultWorkspace?._id;
    }

    // Still no workspace — create one on the fly (race condition with scheduler)
    if (!workspaceId) {
      const now = Date.now();
      const name = user.firstName
        ? `${user.firstName}'s Workspace`
        : "My Workspace";
      workspaceId = await ctx.db.insert("workspaces", {
        name,
        ownerId: user._id,
        plan: "free",
        maxSeats: 1,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("workspaceMembers", {
        workspaceId,
        userId: user._id,
        role: "owner",
        joinedAt: now,
      });
    } else {
      // Verify user is a member of the provided/found workspace
      const membership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", workspaceId!).eq("userId", user._id)
        )
        .first();

      if (!membership) {
        throw new Error("Not a member of this workspace");
      }
    }

    const now = Date.now();

    return await ctx.db.insert("projects", {
      name: args.name,
      url: args.url,
      ownerId: user._id,
      workspaceId,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientCompany: args.clientCompany,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    // Client contact info
    clientName: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Check access (owner or workspace member)
    const canAccess = await hasProjectAccess(ctx, project, user._id);
    if (!canAccess) {
      throw new Error("Not authorized to update this project");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.url !== undefined) updates.url = args.url;
    if (args.clientName !== undefined) updates.clientName = args.clientName;
    if (args.clientEmail !== undefined) updates.clientEmail = args.clientEmail;
    if (args.clientCompany !== undefined) updates.clientCompany = args.clientCompany;

    await ctx.db.patch(args.projectId, updates);
    return args.projectId;
  },
});

// Mark project setup as complete
export const completeSetup = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Check access (owner or workspace member)
    const canAccess = await hasProjectAccess(ctx, project, user._id);
    if (!canAccess) {
      throw new Error("Not authorized to update this project");
    }

    // Only set if not already set
    if (!project.setupCompletedAt) {
      await ctx.db.patch(args.projectId, {
        setupCompletedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return args.projectId;
  },
});

// Delete a project (owner or admin only)
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // For deletion, require owner or admin role
    let canDelete = project.ownerId === user._id;

    const projectWorkspaceId = project.workspaceId;
    if (!canDelete && projectWorkspaceId) {
      const membership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", projectWorkspaceId).eq("userId", user._id)
        )
        .first();

      canDelete =
        membership?.role === "owner" || membership?.role === "admin";
    }

    if (!canDelete) {
      throw new Error("Not authorized to delete this project");
    }

    // Delete all feedbacks for this project first
    const feedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const feedback of feedbacks) {
      await ctx.db.delete(feedback._id);
    }

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});

// Internal: Assign a workspace to a project (for migration/fixes)
export const assignWorkspace = internalMutation({
  args: {
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      workspaceId: args.workspaceId,
      updatedAt: Date.now(),
    });
    return args.projectId;
  },
});
