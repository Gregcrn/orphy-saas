"use client";

import { useState, use, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Settings,
  MessageSquare,
  CheckCircle2,
  Clock,
  Trash2,
  MoreHorizontal,
  Bug,
  Palette,
  FileText,
  HelpCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ArrowUpRight,
  Play,
} from "lucide-react";

import {
  SiGooglechrome,
  SiSafari,
  SiFirefox,
  SiOpera,
  SiBrave,
} from "@icons-pack/react-simple-icons";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useWorkspace } from "@/contexts/workspace-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AssigneeSelect } from "@/components/feedback/assignee-select";
import { FeedbackDetailSheet } from "@/components/feedback/feedback-detail-sheet";
import {
  FeedbackFilters,
  FeedbackFiltersState,
  applyFeedbackFilters,
} from "@/components/feedback/feedback-filters";

type StatusFilter = "all" | "open" | "treated" | "validated" | "resolved";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filters, setFilters] = useState<FeedbackFiltersState>({
    type: "all",
    priority: "all",
    assignee: "all",
    device: "all",
    browser: "all",
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Doc<"feedbacks"> | null>(null);

  const project = useQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });
  const feedbacksRaw = useQuery(api.feedbacks.listByProject, {
    projectId: projectId as Id<"projects">,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const currentUser = useQuery(api.users.getCurrentUser);
  const members = useQuery(
    api.workspaces.getMembers,
    project?.workspaceId ? { workspaceId: project.workspaceId } : "skip"
  );

  // Apply client-side filters
  const feedbacks = useMemo(() => {
    if (!feedbacksRaw) return undefined;
    return applyFeedbackFilters(feedbacksRaw, filters, currentUser?._id);
  }, [feedbacksRaw, filters, currentUser?._id]);

  const updateStatus = useMutation(api.feedbacks.updateStatus);
  const updatePriority = useMutation(api.feedbacks.updatePriority);
  const deleteFeedback = useMutation(api.feedbacks.remove);

  const isLoading = project === undefined || feedbacks === undefined || workspaceLoading;

  // Check if project belongs to current workspace
  const hasAccess = project?.workspaceId === currentWorkspace?._id;

  // Helper functions
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
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
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

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400";
      case "treated":
      case "resolved":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "validated":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const handleReplay = (feedback: { pageUrl: string; _id: string }) => {
    // Open the page with replay parameter
    const url = new URL(feedback.pageUrl);
    url.searchParams.set("orphy_replay", feedback._id);
    window.open(url.toString(), "_blank");
  };

  const formatPagePath = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname === "/" ? "/" : parsed.pathname;
    } catch {
      return url;
    }
  };

  const handleChangeStatus = (
    feedbackId: Id<"feedbacks">,
    status: "open" | "treated" | "validated" | "resolved",
  ) => {
    updateStatus({ feedbackId, status });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
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

  if (!project || !hasAccess) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Link href={`/${locale}/dashboard/projects`}>
          <Button variant="link">{t("common.back")}</Button>
        </Link>
      </div>
    );
  }

  // Use raw feedbacks for stats (before client-side filtering)
  const openCount = feedbacksRaw?.filter((f) => f.status === "open").length ?? 0;
  // Include "resolved" in treated count for backwards compatibility
  const treatedCount =
    feedbacksRaw?.filter((f) => f.status === "treated" || f.status === "resolved").length ?? 0;
  const validatedCount =
    feedbacksRaw?.filter((f) => f.status === "validated").length ?? 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard/projects`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {project.url}
              </a>
            </div>
          </div>
          <Link href={`/${locale}/dashboard/projects/${projectId}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              {t("projects.settings")}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.stats.totalFeedbacks")}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{feedbacksRaw?.length ?? 0}</div>
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
              <div className="text-2xl font-bold">{openCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("feedbacks.status.treated")}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{treatedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("feedbacks.status.validated")}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validatedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Feedbacks Table */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>{t("feedbacks.title")}</CardTitle>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("feedbacks.status.all")}</SelectItem>
                  <SelectItem value="open">{t("feedbacks.status.open")}</SelectItem>
                  <SelectItem value="treated">{t("feedbacks.status.treated")}</SelectItem>
                  <SelectItem value="validated">{t("feedbacks.status.validated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FeedbackFilters
              filters={filters}
              onFiltersChange={setFilters}
              members={members?.filter((m): m is NonNullable<typeof m> => m !== null)}
              currentUserId={currentUser?._id}
            />
          </CardHeader>
          <CardContent>
            {feedbacks?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("dashboard.empty.noFeedbacks")}</p>
                <p className="text-sm">
                  {t("dashboard.empty.noFeedbacksDescription")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>{t("feedbacks.comment")}</TableHead>
                      <TableHead>{t("feedbacks.page")}</TableHead>
                      <TableHead>{t("feedbacks.device")}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>{t("feedbacks.priority.label")}</TableHead>
                      <TableHead>{t("feedbacks.assignee")}</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks?.map((feedback) => (
                      <TableRow key={feedback._id} className="group cursor-pointer select-none" onClick={() => setSelectedFeedback(feedback)}>
                        {/* Type Icon */}
                        <TableCell className="py-3 pr-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center">
                                {getFeedbackTypeIcon(feedback.feedbackType)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t(`feedbacks.type.${feedback.feedbackType}`)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Comment */}
                        <TableCell className="py-3">
                          <p className="font-medium">
                            {feedback.comment.length > 50
                              ? `${feedback.comment.slice(0, 50)}…`
                              : feedback.comment}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.createdAt).toLocaleDateString(locale)}
                          </p>
                        </TableCell>

                        {/* Page */}
                        <TableCell className="py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={feedback.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <span className="truncate">
                                  {formatPagePath(feedback.pageUrl)}
                                </span>
                                <ArrowUpRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[300px]">
                              <p className="text-xs break-all">{feedback.pageUrl}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {feedback.selector}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Device/Browser */}
                        <TableCell className="py-3 whitespace-nowrap">
                          {feedback.deviceInfo ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  {getBrowserIcon(feedback.deviceInfo.browser.name)}
                                  <span className="text-muted-foreground">
                                    {getDeviceIcon(feedback.deviceInfo.device)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p>{feedback.deviceInfo.browser.name} {feedback.deviceInfo.browser.version}</p>
                                  <p>{feedback.deviceInfo.os.name} {feedback.deviceInfo.os.version}</p>
                                  <p>{feedback.deviceInfo.screen.width}×{feedback.deviceInfo.screen.height}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              N/A
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={feedback.status === "resolved" ? "treated" : feedback.status}
                            onValueChange={(v) =>
                              handleChangeStatus(
                                feedback._id,
                                v as "open" | "treated" | "validated"
                              )
                            }
                          >
                            <SelectTrigger className={`w-full h-7 text-xs border-0 ${getStatusStyle(feedback.status)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">{t("feedbacks.status.open")}</SelectItem>
                              <SelectItem value="treated">{t("feedbacks.status.treated")}</SelectItem>
                              <SelectItem value="validated">{t("feedbacks.status.validated")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Priority */}
                        <TableCell className="py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={feedback.priority}
                            onValueChange={(v) =>
                              handleChangePriority(
                                feedback._id,
                                v as "low" | "medium" | "high"
                              )
                            }
                          >
                            <SelectTrigger className={`w-full h-7 text-xs border-0 ${getPriorityStyle(feedback.priority)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">{t("feedbacks.priority.low")}</SelectItem>
                              <SelectItem value="medium">{t("feedbacks.priority.medium")}</SelectItem>
                              <SelectItem value="high">{t("feedbacks.priority.high")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Assignee */}
                        <TableCell className="py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {project.workspaceId && (
                            <AssigneeSelect
                              feedbackId={feedback._id}
                              currentAssignee={feedback.assignedTo}
                              workspaceId={project.workspaceId}
                            />
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleReplay(feedback)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t("feedbacks.replay")}</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReplay(feedback)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  {t("feedbacks.replay")}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Detail Sheet */}
        <FeedbackDetailSheet
          feedback={selectedFeedback}
          onOpenChange={(open) => !open && setSelectedFeedback(null)}
        />
      </div>
    </TooltipProvider>
  );
}
