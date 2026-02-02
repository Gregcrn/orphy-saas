/**
 * Email notifications for feedbacks - Queries & Mutations
 * Uses Resend for email delivery with 5-minute batching per project
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all feedbacks that haven't been notified yet, grouped by project
 */
export const getPendingNotifications = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get feedbacks where notificationSentAt is undefined
    const pendingFeedbacks = await ctx.db
      .query("feedbacks")
      .filter((q) => q.eq(q.field("notificationSentAt"), undefined))
      .collect();

    if (pendingFeedbacks.length === 0) {
      return [];
    }

    // Group by project
    const byProject = new Map<string, typeof pendingFeedbacks>();
    for (const feedback of pendingFeedbacks) {
      const projectId = feedback.projectId;
      if (!byProject.has(projectId)) {
        byProject.set(projectId, []);
      }
      byProject.get(projectId)!.push(feedback);
    }

    // Get project and workspace details for each group
    const result = [];
    for (const [projectId, feedbacks] of byProject) {
      const project = await ctx.db.get(projectId as Id<"projects">);
      if (!project || !project.workspaceId) continue;

      const workspace = await ctx.db.get(project.workspaceId);
      if (!workspace) continue;

      // Get workspace owner email
      const owner = await ctx.db.get(workspace.ownerId);
      if (!owner?.email) continue;

      // Get all workspace members for notifications
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", project.workspaceId!))
        .collect();

      const memberEmails: string[] = [owner.email];
      for (const member of members) {
        const user = await ctx.db.get(member.userId);
        if (user?.email && !memberEmails.includes(user.email)) {
          memberEmails.push(user.email);
        }
      }

      result.push({
        projectId,
        projectName: project.name,
        projectUrl: project.url,
        workspaceName: workspace.name,
        recipientEmails: memberEmails,
        feedbacks: feedbacks.map((f) => ({
          id: f._id,
          type: f.feedbackType,
          comment: f.comment,
          pageUrl: f.pageUrl,
          createdAt: f.createdAt,
        })),
      });
    }

    return result;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Mark feedbacks as notified
 */
export const markAsNotified = internalMutation({
  args: {
    feedbackIds: v.array(v.id("feedbacks")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.feedbackIds) {
      await ctx.db.patch(id, { notificationSentAt: now });
    }
  },
});
