"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/contexts/workspace-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();

  const allProjects = useQuery(api.projects.list);
  const allFeedbacks = useQuery(api.feedbacks.listAll, {});

  // Filter projects by current workspace
  const projects = allProjects?.filter(
    (project) => project.workspaceId === currentWorkspace?._id
  );

  // Get project IDs for the current workspace
  const workspaceProjectIds = useMemo(
    () => new Set(projects?.map((p) => p._id) ?? []),
    [projects]
  );

  // Filter feedbacks to only show those from projects in the current workspace
  const feedbacks = useMemo(
    () => allFeedbacks?.filter((f) => workspaceProjectIds.has(f.projectId)),
    [allFeedbacks, workspaceProjectIds]
  );

  const isLoading = allProjects === undefined || allFeedbacks === undefined || workspaceLoading;

  const openFeedbacks = feedbacks?.filter((f) => f.status === "open") ?? [];
  const resolvedFeedbacks = feedbacks?.filter((f) => f.status === "resolved") ?? [];
  const recentFeedbacks = feedbacks?.slice(0, 5) ?? [];

  // Get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects?.find((p) => p._id === projectId);
    return project?.name ?? "Unknown";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state — no projects yet
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D4A373]/10 flex items-center justify-center mb-6">
              <FolderKanban className="h-8 w-8 text-[#D4A373]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {t("dashboard.empty.noProjects")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("dashboard.empty.noProjectsDescription")}
            </p>
            <Link href={`/${locale}/dashboard/projects?new=true`}>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D4A373] hover:bg-[#c49366] text-white font-medium transition-colors">
                <FolderKanban className="h-4 w-4" />
                {t("projects.new")}
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.totalProjects")}
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.totalFeedbacks")}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.openFeedbacks")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openFeedbacks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.resolvedFeedbacks")}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedFeedbacks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedbacks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.recentFeedbacks")}</CardTitle>
          <Link
            href={`/${locale}/dashboard/projects`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {t("dashboard.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {recentFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("dashboard.empty.noFeedbacks")}</p>
              <p className="text-sm">{t("dashboard.empty.noFeedbacksDescription")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {feedback.comment}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getProjectName(feedback.projectId)} •{" "}
                      {new Date(feedback.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge
                      variant={feedback.status === "open" ? "default" : "secondary"}
                    >
                      {t(`feedbacks.status.${feedback.status}`)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        feedback.priority === "high"
                          ? "border-red-500 text-red-500"
                          : feedback.priority === "medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-gray-500 text-gray-500"
                      }
                    >
                      {t(`feedbacks.priority.${feedback.priority}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
