import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user by Clerk ID (internal - for actions)
export const getByClerkIdInternal = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      createdAt: now,
      updatedAt: now,
    });

    // Create default workspace for the new user
    const workspaceName = args.firstName
      ? `${args.firstName}'s Workspace`
      : "My Workspace";

    await ctx.scheduler.runAfter(0, internal.workspaces.createForUser, {
      userId,
      name: workspaceName,
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error(`User with clerkId ${args.clerkId} not found`);
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.email !== undefined) updates.email = args.email;
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      // User already deleted or never synced - not an error
      console.log(`User with clerkId ${args.clerkId} not found, skipping delete`);
      return null;
    }

    await ctx.db.delete(user._id);
    return user._id;
  },
});

// Internal: Complete cleanup for testing - removes user, their workspaces, and memberships
export const cleanupUserForTesting = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const deleted = { user: false, workspaces: 0, memberships: 0 };

    // Delete all workspace memberships for this user
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
      deleted.memberships++;
    }

    // Delete workspaces owned by this user
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();
    for (const w of workspaces) {
      // Also delete any memberships in this workspace
      const wsMembers = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", w._id))
        .collect();
      for (const m of wsMembers) {
        await ctx.db.delete(m._id);
      }
      await ctx.db.delete(w._id);
      deleted.workspaces++;
    }

    // Delete the user
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.delete(args.userId);
      deleted.user = true;
    }

    return deleted;
  },
});
