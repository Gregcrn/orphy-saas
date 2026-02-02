"use node";

/**
 * Email notifications - Node.js Actions
 * Separate file because Resend requires Node.js runtime
 */

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

// =============================================================================
// ACTIONS (can call external APIs)
// =============================================================================

/**
 * Send batched email notifications
 * Called by cron every 5 minutes
 */
export const sendBatchedNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get pending notifications grouped by project
    const pendingGroups = await ctx.runQuery(internal.notifications.getPendingNotifications);

    if (pendingGroups.length === 0) {
      return { sent: 0 };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return { sent: 0, error: "RESEND_API_KEY not configured" };
    }

    const resend = new Resend(resendApiKey);
    let totalSent = 0;

    for (const group of pendingGroups) {
      try {
        // Build email content
        const feedbackList = group.feedbacks
          .map((f: any) => {
            const icon = getTypeIcon(f.type);
            const shortComment = f.comment.length > 100
              ? f.comment.substring(0, 100) + "..."
              : f.comment;
            return `${icon} <strong>${capitalizeFirst(f.type)}</strong>: ${shortComment}`;
          })
          .join("<br><br>");

        const subject = group.feedbacks.length === 1
          ? `Nouveau feedback sur ${group.projectName}`
          : `${group.feedbacks.length} nouveaux feedbacks sur ${group.projectName}`;

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px;">${subject}</h2>
            <p style="color: #666; margin-bottom: 24px;">Workspace: ${group.workspaceName}</p>

            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              ${feedbackList}
            </div>

            <a href="${getDashboardUrl(group.projectId)}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                      border-radius: 6px; text-decoration: none; font-weight: 500;">
              Voir dans le dashboard
            </a>

            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              Orphy - Feedback widget pour agences
            </p>
          </div>
        `;

        // Send to all workspace members
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Orphy <notifications@orphy.app>";
        await resend.emails.send({
          from: fromEmail,
          to: group.recipientEmails,
          subject,
          html,
        });

        // Mark feedbacks as notified
        await ctx.runMutation(internal.notifications.markAsNotified, {
          feedbackIds: group.feedbacks.map((f: any) => f.id),
        });

        totalSent += group.feedbacks.length;
        console.log(`Sent notification for ${group.feedbacks.length} feedbacks on ${group.projectName}`);
      } catch (error) {
        console.error(`Failed to send notification for project ${group.projectName}:`, error);
      }
    }

    return { sent: totalSent };
  },
});

// =============================================================================
// HELPERS
// =============================================================================

function getTypeIcon(type: string): string {
  switch (type) {
    case "bug": return "🐛";
    case "design": return "🎨";
    case "content": return "📄";
    case "question": return "❓";
    default: return "💬";
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDashboardUrl(projectId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.orphy.io";
  return `${baseUrl}/fr/dashboard/projects/${projectId}`;
}
