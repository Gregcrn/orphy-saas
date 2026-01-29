import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

/** Check if user is a member of a workspace */
async function isWorkspaceMember(
  ctx: { db: any },
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .first();

  return !!membership;
}

/** Get user's role in a workspace */
async function getWorkspaceRole(
  ctx: { db: any },
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
): Promise<string | null> {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .first();

  return membership?.role ?? null;
}

// =============================================================================
// INTERNAL QUERIES
// =============================================================================

/** Get workspace by ID (internal - for actions) */
export const getWorkspaceInternal = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

/** Get membership for a user in a workspace (internal - for actions) */
export const getMembershipInternal = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.userId)
      )
      .first();
  },
});

// =============================================================================
// QUERIES
// =============================================================================

/** List all workspaces the current user is a member of */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get all memberships for this user
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the workspace details for each membership
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        return workspace
          ? {
              ...workspace,
              role: membership.role,
            }
          : null;
      })
    );

    return workspaces.filter(Boolean);
  },
});

/** Get a single workspace by ID (if user has access) */
export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Check membership
    const isMember = await isWorkspaceMember(ctx, args.workspaceId, user._id);
    if (!isMember) {
      return null;
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }

    const role = await getWorkspaceRole(ctx, args.workspaceId, user._id);

    return {
      ...workspace,
      role,
    };
  },
});

/** Get members of a workspace */
export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Check membership
    const isMember = await isWorkspaceMember(ctx, args.workspaceId, user._id);
    if (!isMember) {
      return [];
    }

    // Get all members
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Fetch user details for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        return memberUser
          ? {
              ...membership,
              user: {
                _id: memberUser._id,
                email: memberUser.email,
                firstName: memberUser.firstName,
                lastName: memberUser.lastName,
                imageUrl: memberUser.imageUrl,
              },
            }
          : null;
      })
    );

    return members.filter(Boolean);
  },
});

/** Get the current user's default workspace (first one they own) */
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Find a workspace where user is owner
    const ownerMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("role"), "owner"))
      .first();

    if (ownerMembership) {
      return await ctx.db.get(ownerMembership.workspaceId);
    }

    // Fallback: first workspace they're a member of
    const anyMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (anyMembership) {
      return await ctx.db.get(anyMembership.workspaceId);
    }

    return null;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/** Create a new workspace (and add creator as owner) */
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      ownerId: user._id,
      plan: "free",
      maxSeats: 1, // Free plan = 1 seat
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner member
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    return workspaceId;
  },
});

/** Internal: Create workspace for a new user (called from user creation) */
export const createForUser = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      ownerId: args.userId,
      plan: "free",
      maxSeats: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Add user as owner member
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: args.userId,
      role: "owner",
      joinedAt: now,
    });

    return workspaceId;
  },
});

/** Update workspace details (owner/admin only) */
export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check role
    const role = await getWorkspaceRole(ctx, args.workspaceId, user._id);
    if (role !== "owner" && role !== "admin") {
      throw new Error("Not authorized to update this workspace");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch(args.workspaceId, updates);
    return args.workspaceId;
  },
});

/** Internal: Add a member to a workspace (for manual fixes) */
export const addMemberInternal = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      role: args.role,
      joinedAt: now,
    });
  },
});

/** Count current members in a workspace */
export const getMemberCount = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return 0;
    }

    const isMember = await isWorkspaceMember(ctx, args.workspaceId, user._id);
    if (!isMember) {
      return 0;
    }

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return members.length;
  },
});
