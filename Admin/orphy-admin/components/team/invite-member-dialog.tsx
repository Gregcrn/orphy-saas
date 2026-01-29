"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
import { Loader2, UserPlus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteMemberDialogProps {
  workspaceId: Id<"workspaces">;
  onInviteSent?: () => void;
}

type InvitationRole = "admin" | "member" | "viewer";

export function InviteMemberDialog({
  workspaceId,
  onInviteSent,
}: InviteMemberDialogProps) {
  const t = useTranslations("team");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendInvitation = useAction(api.invitations.sendInvitation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendInvitation({
        workspaceId,
        email: email.trim().toLowerCase(),
        role,
      });
      setSuccess(t("inviteDialog.success", { email: email.trim() }));
      setEmail("");
      setRole("member");
      onInviteSent?.();
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("already a member")) {
        setError(t("inviteDialog.alreadyMember"));
      } else if (message.includes("already been sent")) {
        setError(t("inviteDialog.alreadyInvited"));
      } else {
        setError(t("inviteDialog.error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setEmail("");
      setRole("member");
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("invite")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("inviteDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("inviteDialog.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("inviteDialog.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">{t("inviteDialog.roleLabel")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as InvitationRole)}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={t("inviteDialog.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span>{t("roles.admin")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex flex-col items-start">
                      <span>{t("roles.member")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span>{t("roles.viewer")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t(`roleDescriptions.${role}`)}
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("inviteDialog.sending")}
                </>
              ) : (
                t("inviteDialog.send")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
