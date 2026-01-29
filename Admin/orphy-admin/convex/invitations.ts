import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// =============================================================================
// CONSTANTS
// =============================================================================

const INVITATION_EXPIRY_DAYS = 7;
const TOKEN_LENGTH = 32;

// =============================================================================
// HELPERS
// =============================================================================

/** Generate a random token for invitation links */
function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

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

/** Check if user can invite members (owner or admin) */
async function canInviteMembers(
  ctx: { db: any },
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
): Promise<boolean> {
  const role = await getWorkspaceRole(ctx, workspaceId, userId);
  return role === "owner" || role === "admin";
}

// =============================================================================
// INTERNAL QUERIES
// =============================================================================

/** Get workspace by ID (internal, no auth check) */
export const getWorkspaceInternal = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

/** Get user by ID (internal, no auth check) */
export const getUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/** Get user by email (internal, no auth check) */
export const getUserByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .collect();
    return users[0] ?? null;
  },
});

// =============================================================================
// QUERIES
// =============================================================================

/** List pending invitations for a workspace */
export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Check user has access to this workspace
    const role = await getWorkspaceRole(ctx, args.workspaceId, user._id);
    if (!role) {
      return [];
    }

    // Get pending invitations
    const invitations = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Enrich with inviter info
    const enrichedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.invitedBy);
        return {
          ...invitation,
          inviter: inviter
            ? {
                firstName: inviter.firstName,
                lastName: inviter.lastName,
                email: inviter.email,
              }
            : null,
        };
      })
    );

    return enrichedInvitations;
  },
});

/** Get invitation details by token (public - no auth required) */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return null;
    }

    // Get workspace info
    const workspace = await ctx.db.get(invitation.workspaceId);

    // Get inviter info
    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      ...invitation,
      workspace: workspace
        ? {
            _id: workspace._id,
            name: workspace.name,
          }
        : null,
      inviter: inviter
        ? {
            firstName: inviter.firstName,
            lastName: inviter.lastName,
            email: inviter.email,
          }
        : null,
    };
  },
});

// =============================================================================
// INTERNAL MUTATIONS
// =============================================================================

/** Create an invitation record (called after email is sent) */
export const createInvitation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    token: v.string(),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const invitationId = await ctx.db.insert("workspaceInvitations", {
      workspaceId: args.workspaceId,
      email: args.email.toLowerCase(),
      role: args.role,
      token: args.token,
      invitedBy: args.invitedBy,
      status: "pending",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return invitationId;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/** Revoke a pending invitation */
export const revoke = mutation({
  args: { invitationId: v.id("workspaceInvitations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check permissions
    const canInvite = await canInviteMembers(
      ctx,
      invitation.workspaceId,
      user._id
    );
    if (!canInvite) {
      throw new Error("Not authorized to revoke invitations");
    }

    // Can only revoke pending invitations
    if (invitation.status !== "pending") {
      throw new Error("Can only revoke pending invitations");
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
      updatedAt: Date.now(),
    });

    return args.invitationId;
  },
});

/** Accept an invitation and join the workspace */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Find invitation by token
    const invitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check status
    if (invitation.status !== "pending") {
      throw new Error(
        invitation.status === "accepted"
          ? "Invitation already accepted"
          : invitation.status === "expired"
            ? "Invitation has expired"
            : "Invitation has been revoked"
      );
    }

    // Check expiration
    if (Date.now() > invitation.expiresAt) {
      await ctx.db.patch(invitation._id, {
        status: "expired",
        updatedAt: Date.now(),
      });
      throw new Error("Invitation has expired");
    }

    // Check email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error(
        "This invitation was sent to a different email address. Please sign in with the correct account."
      );
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", invitation.workspaceId).eq("userId", user._id)
      )
      .first();

    if (existingMembership) {
      // Mark invitation as accepted anyway
      await ctx.db.patch(invitation._id, {
        status: "accepted",
        acceptedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { workspaceId: invitation.workspaceId, alreadyMember: true };
    }

    const now = Date.now();

    // Create workspace membership
    await ctx.db.insert("workspaceMembers", {
      workspaceId: invitation.workspaceId,
      userId: user._id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
      joinedAt: now,
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    return { workspaceId: invitation.workspaceId, alreadyMember: false };
  },
});

// =============================================================================
// ACTIONS (for external API calls like Resend)
// =============================================================================

/** Send an invitation email via Resend and create the invitation record */
export const sendInvitation = action({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args): Promise<{ invitationId: Id<"workspaceInvitations">; email: string }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user = await ctx.runQuery(internal.users.getByClerkIdInternal, {
      clerkId: identity.subject,
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Get workspace
    const workspace = await ctx.runQuery(
      internal.invitations.getWorkspaceInternal,
      {
        workspaceId: args.workspaceId,
      }
    );
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Check permissions
    const membership = await ctx.runQuery(
      internal.workspaces.getMembershipInternal,
      {
        workspaceId: args.workspaceId,
        userId: user._id,
      }
    );
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Not authorized to invite members");
    }

    // Check if email is already a member
    const existingUser = await ctx.runQuery(
      internal.invitations.getUserByEmailInternal,
      { email: args.email }
    );
    if (existingUser) {
      const existingMembership = await ctx.runQuery(
        internal.workspaces.getMembershipInternal,
        {
          workspaceId: args.workspaceId,
          userId: existingUser._id,
        }
      );
      if (existingMembership) {
        throw new Error("This user is already a member of this workspace");
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvitations = await ctx.runQuery(
      internal.invitations.getPendingByEmailInternal,
      {
        workspaceId: args.workspaceId,
        email: args.email,
      }
    );
    if (existingInvitations) {
      throw new Error(
        "An invitation has already been sent to this email address"
      );
    }

    // Generate token
    const token = generateToken();

    // Build invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;

    // Get inviter name
    const inviterName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.email;

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "Orphy <noreply@orphy.app>";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [args.email],
        subject: `${inviterName} vous invite à rejoindre ${workspace.name} sur Orphy`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #37352f; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDF6F0;">
  <div style="background: #D4A373; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orphy</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Gestion des feedbacks pour agences digitales</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e9e9e7; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #37352f; margin-top: 0;">Vous avez été invité !</h2>

    <p><strong>${inviterName}</strong> vous invite à rejoindre l'espace de travail <strong>${workspace.name}</strong> sur Orphy.</p>

    <p>Orphy vous permet de collecter et gérer les feedbacks de vos clients directement sur leurs sites web, sans captures d'écran ni fils d'emails interminables.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background: #D4A373; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Accepter l'invitation
      </a>
    </div>

    <p style="color: #6b6b6b; font-size: 14px;">Cette invitation expire dans 7 jours.</p>

    <hr style="border: none; border-top: 1px solid #e9e9e7; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email en toute sécurité.
    </p>
  </div>
</body>
</html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);
      throw new Error("Failed to send invitation email");
    }

    // Create invitation record
    const invitationId = await ctx.runMutation(
      internal.invitations.createInvitation,
      {
        workspaceId: args.workspaceId,
        email: args.email,
        role: args.role,
        token,
        invitedBy: user._id,
      }
    );

    return { invitationId, email: args.email };
  },
});

// =============================================================================
// ADDITIONAL INTERNAL QUERIES
// =============================================================================

/** Delete an invitation (internal - for testing/cleanup) */
export const deleteInvitation = internalMutation({
  args: { invitationId: v.id("workspaceInvitations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invitationId);
    return args.invitationId;
  },
});

/** Check if there's a pending invitation for an email in a workspace */
export const getPendingByEmailInternal = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), args.email.toLowerCase()),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    return invitation;
  },
});
