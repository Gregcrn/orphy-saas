"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { Mail, X, Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InvitationRowProps {
  invitation: {
    _id: Id<"workspaceInvitations">;
    email: string;
    role: "admin" | "member" | "viewer";
    expiresAt: number;
    createdAt: number;
    inviter: {
      firstName?: string;
      lastName?: string;
      email: string;
    } | null;
  };
  onRevoked?: () => void;
}

function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "outline" {
  switch (role) {
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

export function InvitationRow({ invitation, onRevoked }: InvitationRowProps) {
  const t = useTranslations("team");
  const [isRevoking, setIsRevoking] = useState(false);
  const revokeMutation = useMutation(api.invitations.revoke);

  const inviterName = invitation.inviter
    ? invitation.inviter.firstName && invitation.inviter.lastName
      ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
      : invitation.inviter.firstName || invitation.inviter.email
    : "Unknown";

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeMutation({ invitationId: invitation._id });
      onRevoked?.();
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{invitation.email}</p>
            <p className="text-sm text-muted-foreground">
              {t("invitedBy", { name: inviterName })}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(invitation.role)}>
          {t(`roles.${invitation.role}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {t("expiresOn", {
          date: new Date(invitation.expiresAt).toLocaleDateString(),
        })}
      </TableCell>
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  {t("revoke")}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("revoke")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("revokeConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke}>
                {t("revoke")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
