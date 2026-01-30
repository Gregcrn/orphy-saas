"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Bug,
  Palette,
  FileText,
  HelpCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
} from "lucide-react";

import {
  SiGooglechrome,
  SiSafari,
  SiFirefox,
  SiOpera,
  SiBrave,
} from "@icons-pack/react-simple-icons";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWorkspace } from "@/contexts/workspace-context";
import { AssigneeSelect } from "@/components/feedback/assignee-select";
import { ResolveDialog } from "@/components/feedback/resolve-dialog";
import {
  FeedbackFilters,
  FeedbackFiltersState,
  applyFeedbackFilters,
} from "@/components/feedback/feedback-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "open" | "treated" | "validated" | "resolved";

export default function InboxPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace } = useWorkspace();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filters, setFilters] = useState<FeedbackFiltersState>({
    type: "all",
    priority: "all",
    assignee: "all",
    device: "all",
    browser: "all",
    project: "all",
  });
  const [resolvingFeedback, setResolvingFeedback] = useState<{
    id: Id<"feedbacks">;
    comment: string;
  } | null>(null);

  const allProjects = useQuery(api.projects.list);
  const allFeedbacks = useQuery(api.feedbacks.listAll, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const currentUser = useQuery(api.users.getCurrentUser);
  const members = useQuery(
    api.workspaces.getMembers,
    currentWorkspace?._id ? { workspaceId: currentWorkspace._id } : "skip"
  );

  const reopen = useMutation(api.feedbacks.reopen);
  const updatePriority = useMutation(api.feedbacks.updatePriority);
  const deleteFeedback = useMutation(api.feedbacks.remove);

  // Filter projects by current workspace
  const projects = useMemo(
    () =>
      allProjects?.filter(
        (project) => project.workspaceId === currentWorkspace?._id
      ),
    [allProjects, currentWorkspace?._id]
  );

  // Get project IDs for the current workspace
  const workspaceProjectIds = useMemo(
    () => new Set(projects?.map((p) => p._id) ?? []),
    [projects]
  );

  // Filter feedbacks to only show those from projects in the current workspace
  const workspaceFeedbacks = useMemo(
    () => allFeedbacks?.filter((f) => workspaceProjectIds.has(f.projectId)),
    [allFeedbacks, workspaceProjectIds]
  );

  // Apply client-side filters
  const feedbacks = useMemo(() => {
    if (!workspaceFeedbacks) return undefined;
    return applyFeedbackFilters(workspaceFeedbacks, filters, currentUser?._id);
  }, [workspaceFeedbacks, filters, currentUser?._id]);

  const isLoading = allProjects === undefined || allFeedbacks === undefined || !currentWorkspace;

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p) => p._id === projectId);
    return project?.name ?? "Unknown";
  };

  const getProjectUrl = (projectId: string) => {
    return `/${locale}/dashboard/projects/${projectId}`;
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4 text-red-500" />;
      case "design":
        return <Palette className="h-4 w-4 text-purple-500" />;
      case "content":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "question":
        return <HelpCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-3.5 w-3.5" />;
      case "tablet":
        return <Tablet className="h-3.5 w-3.5" />;
      default:
        return <Monitor className="h-3.5 w-3.5" />;
    }
  };

  const getBrowserIcon = (browserName: string) => {
    const name = browserName.toLowerCase();
    const iconClass = "h-4 w-4";
    if (name.includes("chrome") && !name.includes("headless")) return <SiGooglechrome className={iconClass} color="#4285F4" />;
    if (name.includes("safari")) return <SiSafari className={iconClass} color="#006CFF" />;
    if (name.includes("firefox")) return <SiFirefox className={iconClass} color="#FF7139" />;
    if (name.includes("opera")) return <SiOpera className={iconClass} color="#FF1B2D" />;
    if (name.includes("brave")) return <SiBrave className={iconClass} color="#FB542B" />;
    // Edge, Arc, Samsung Internet, etc. use generic icon
    return <Globe className={iconClass} />;
  };

  const handleToggleStatus = (
    feedbackId: Id<"feedbacks">,
    currentStatus: "open" | "treated" | "validated" | "resolved",
    comment: string
  ) => {
    if (currentStatus === "open") {
      // Opening resolve dialog (mark as treated)
      setResolvingFeedback({ id: feedbackId, comment });
    } else {
      // Reopening from treated, validated, or resolved (legacy)
      reopen({ feedbackId });
    }
  };

  const handleChangePriority = async (
    feedbackId: Id<"feedbacks">,
    priority: "low" | "medium" | "high"
  ) => {
    await updatePriority({ feedbackId, priority });
  };

  const handleDelete = async (feedbackId: Id<"feedbacks">) => {
    if (confirm(t("feedbacks.deleteConfirm"))) {
      await deleteFeedback({ feedbackId });
    }
  };

  // Use workspace feedbacks for stats (before client-side filtering)
  const openCount =
    workspaceFeedbacks?.filter((f) => f.status === "open").length ?? 0;
  // Include "resolved" in treated count for backwards compatibility
  const treatedCount =
    workspaceFeedbacks?.filter((f) => f.status === "treated" || f.status === "resolved").length ?? 0;
  const validatedCount =
    workspaceFeedbacks?.filter((f) => f.status === "validated").length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("feedbacks.inbox")}</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("feedbacks.inbox")}</h1>

      <Card>
        <CardHeader className="space-y-4">
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">
                {t("feedbacks.status.all")} ({workspaceFeedbacks?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="open">
                {t("feedbacks.status.open")} ({openCount})
              </TabsTrigger>
              <TabsTrigger value="treated">
                {t("feedbacks.status.treated")} ({treatedCount})
              </TabsTrigger>
              <TabsTrigger value="validated">
                {t("feedbacks.status.validated")} ({validatedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <FeedbackFilters
            filters={filters}
            onFiltersChange={setFilters}
            members={members?.filter((m): m is NonNullable<typeof m> => m !== null)}
            currentUserId={currentUser?._id}
            projects={projects}
            showProjectFilter={true}
          />
        </CardHeader>
        <CardContent>
          {feedbacks?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {t("dashboard.empty.noFeedbacks")}
              </p>
              <p className="text-sm">
                {t("dashboard.empty.noFeedbacksDescription")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>{t("feedbacks.comment")}</TableHead>
                  <TableHead>{t("sidebar.projects")}</TableHead>
                  <TableHead>{t("feedbacks.browser")}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{t("feedbacks.priority.label")}</TableHead>
                  <TableHead>{t("feedbacks.assignee")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks?.map((feedback) => (
                  <TableRow key={feedback._id}>
                    <TableCell>
                      <div className="flex items-center justify-center" title={t(`feedbacks.type.${feedback.feedbackType}`)}>
                        {getFeedbackTypeIcon(feedback.feedbackType)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <p className="truncate font-medium">{feedback.comment}</p>
                      <p className="text-xs text-muted-foreground">
                                                {new Date(feedback.createdAt).toLocaleDateString(locale)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={getProjectUrl(feedback.projectId)}
                        className="flex items-center gap-1 text-sm hover:underline"
                      >
                        {getProjectName(feedback.projectId)}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      {feedback.deviceInfo ? (
                        <div className="flex items-center gap-2" title={`${feedback.deviceInfo.browser.name} ${feedback.deviceInfo.browser.version} · ${feedback.deviceInfo.os.name} · ${feedback.deviceInfo.screen.width}×${feedback.deviceInfo.screen.height}`}>
                          {getBrowserIcon(feedback.deviceInfo.browser.name)}
                          <span className="text-muted-foreground">
                            {getDeviceIcon(feedback.deviceInfo.device)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {t("common.noResults")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            feedback.status === "open"
                              ? "default"
                              : feedback.status === "treated" || feedback.status === "resolved"
                              ? "outline"
                              : "secondary"
                          }
                          className={`cursor-pointer ${
                            feedback.status === "treated" || feedback.status === "resolved"
                              ? "border-blue-500 text-blue-600 bg-blue-50"
                              : feedback.status === "validated"
                              ? "bg-green-100 text-green-700"
                              : ""
                          }`}
                          onClick={() =>
                            handleToggleStatus(feedback._id, feedback.status as "open" | "treated" | "validated" | "resolved", feedback.comment)
                          }
                        >
                          {t(`feedbacks.status.${feedback.status === "resolved" ? "treated" : feedback.status}`)}
                        </Badge>
                        {feedback.resolutionNote && (
                          <span title={feedback.resolutionNote}>
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={feedback.priority}
                        onValueChange={(v) =>
                          handleChangePriority(
                            feedback._id,
                            v as "low" | "medium" | "high"
                          )
                        }
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            {t("feedbacks.priority.low")}
                          </SelectItem>
                          <SelectItem value="medium">
                            {t("feedbacks.priority.medium")}
                          </SelectItem>
                          <SelectItem value="high">
                            {t("feedbacks.priority.high")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {currentWorkspace && (
                        <AssigneeSelect
                          feedbackId={feedback._id}
                          currentAssignee={feedback.assignedTo}
                          workspaceId={currentWorkspace._id}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(feedback._id, feedback.status as "open" | "treated" | "validated" | "resolved", feedback.comment)
                            }
                          >
                            {feedback.status === "open"
                              ? t("feedbacks.markTreated")
                              : t("feedbacks.markOpen")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(feedback._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("feedbacks.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      {resolvingFeedback && (
        <ResolveDialog
          feedbackId={resolvingFeedback.id}
          feedbackComment={resolvingFeedback.comment}
          open={true}
          onOpenChange={(open) => !open && setResolvingFeedback(null)}
        />
      )}
    </div>
  );
}
