"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberRow } from "@/components/team/member-row";
import { InvitationRow } from "@/components/team/invitation-row";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";

export default function TeamSettingsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  // Get current workspace
  const workspace = useQuery(api.workspaces.getDefault);
  const workspaceId = workspace?._id;

  // Get members and invitations
  const members = useQuery(
    api.workspaces.getMembers,
    workspaceId ? { workspaceId } : "skip"
  );
  const invitations = useQuery(
    api.invitations.listByWorkspace,
    workspaceId ? { workspaceId } : "skip"
  );

  // Get current user's role in the workspace
  const workspaceWithRole = useQuery(
    api.workspaces.get,
    workspaceId ? { workspaceId } : "skip"
  );
  const canInvite =
    workspaceWithRole?.role === "owner" || workspaceWithRole?.role === "admin";

  const isLoading = !workspace || !members || invitations === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Settings Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href={`/${locale}/dashboard/settings`}>
            <User className="h-4 w-4" />
            {t("settings.account")}
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          {t("settings.team")}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("team.title")}
          </h2>
          <p className="text-muted-foreground">{t("team.description")}</p>
        </div>
        {canInvite && workspaceId && (
          <InviteMemberDialog workspaceId={workspaceId} />
        )}
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("team.members")}</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "membre" : "membres"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("team.noMembers")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Membre</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Depuis</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.filter(Boolean).map((member) => (
                  <MemberRow key={member!._id} member={member as any} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>{t("team.invitations")}</CardTitle>
            <CardDescription>
              {invitations?.length ?? 0} invitation
              {(invitations?.length ?? 0) !== 1 ? "s" : ""} en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!invitations || invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t("team.noInvitations")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation: any) => (
                    <InvitationRow
                      key={invitation._id}
                      invitation={invitation}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
