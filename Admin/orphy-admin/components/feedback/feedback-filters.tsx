"use client";

import { useTranslations } from "next-intl";
import {
  X,
  Tag,
  Flag,
  User,
  Monitor,
  Globe,
  FolderOpen,
} from "lucide-react";

import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FeedbackType = "all" | "bug" | "design" | "content" | "question";
export type PriorityFilter = "all" | "high" | "medium" | "low";
export type AssigneeFilter = "all" | "me" | "unassigned" | Id<"users">;
export type DeviceFilter = "all" | "desktop" | "mobile" | "tablet";
export type BrowserFilter = "all" | "chrome" | "safari" | "firefox" | "edge" | "other";

export interface FeedbackFiltersState {
  type: FeedbackType;
  priority: PriorityFilter;
  assignee: AssigneeFilter;
  device: DeviceFilter;
  browser: BrowserFilter;
  project?: string; // For inbox only
}

interface Member {
  user: {
    _id: Id<"users">;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  };
}

interface Project {
  _id: Id<"projects">;
  name: string;
}

interface FeedbackFiltersProps {
  filters: FeedbackFiltersState;
  onFiltersChange: (filters: FeedbackFiltersState) => void;
  members?: Member[];
  currentUserId?: Id<"users">;
  projects?: Project[]; // For inbox only
  showProjectFilter?: boolean;
}

const DEFAULT_FILTERS: FeedbackFiltersState = {
  type: "all",
  priority: "all",
  assignee: "all",
  device: "all",
  browser: "all",
  project: "all",
};

export function FeedbackFilters({
  filters,
  onFiltersChange,
  members,
  currentUserId,
  projects,
  showProjectFilter = false,
}: FeedbackFiltersProps) {
  const t = useTranslations("feedbacks");

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.priority !== "all" ||
    filters.assignee !== "all" ||
    filters.device !== "all" ||
    filters.browser !== "all" ||
    (showProjectFilter && filters.project !== "all");

  const handleReset = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  // Filter out null members
  const validMembers = members?.filter((m): m is NonNullable<typeof m> => m !== null) ?? [];

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Type Filter */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {t("filters.type")}
        </label>
        <Select
          value={filters.type}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, type: value as FeedbackType })
          }
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder={t("filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
            <SelectItem value="bug">{t("type.bug")}</SelectItem>
            <SelectItem value="design">{t("type.design")}</SelectItem>
            <SelectItem value="content">{t("type.content")}</SelectItem>
            <SelectItem value="question">{t("type.question")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Flag className="h-3 w-3" />
          {t("priority.label")}
        </label>
        <Select
          value={filters.priority}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, priority: value as PriorityFilter })
          }
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder={t("filters.allPriorities")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allPriorities")}</SelectItem>
            <SelectItem value="high">{t("priority.high")}</SelectItem>
            <SelectItem value="medium">{t("priority.medium")}</SelectItem>
            <SelectItem value="low">{t("priority.low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignee Filter */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          {t("assignee")}
        </label>
        <Select
          value={filters.assignee}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, assignee: value as AssigneeFilter })
          }
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder={t("filters.allAssignees")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allAssignees")}</SelectItem>
            {currentUserId && (
              <SelectItem value="me">{t("filters.assignedToMe")}</SelectItem>
            )}
            <SelectItem value="unassigned">{t("unassigned")}</SelectItem>
            {validMembers.map((member) => (
              <SelectItem key={member.user._id} value={member.user._id}>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {member.user.imageUrl && (
                      <AvatarImage src={member.user.imageUrl} />
                    )}
                    <AvatarFallback>
                      {getInitials(
                        member.user.firstName,
                        member.user.lastName,
                        member.user.email
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {member.user.firstName
                      ? `${member.user.firstName} ${member.user.lastName ?? ""}`.trim()
                      : member.user.email}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Device Filter */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          {t("device")}
        </label>
        <Select
          value={filters.device}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, device: value as DeviceFilter })
          }
        >
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder={t("filters.allDevices")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allDevices")}</SelectItem>
            <SelectItem value="desktop">{t("deviceType.desktop")}</SelectItem>
            <SelectItem value="mobile">{t("deviceType.mobile")}</SelectItem>
            <SelectItem value="tablet">{t("deviceType.tablet")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Browser Filter */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {t("browser")}
        </label>
        <Select
          value={filters.browser}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, browser: value as BrowserFilter })
          }
        >
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder={t("filters.allBrowsers")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allBrowsers")}</SelectItem>
            <SelectItem value="chrome">Chrome</SelectItem>
            <SelectItem value="safari">Safari</SelectItem>
            <SelectItem value="firefox">Firefox</SelectItem>
            <SelectItem value="edge">Edge</SelectItem>
            <SelectItem value="other">{t("filters.otherBrowser")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Filter (Inbox only) */}
      {showProjectFilter && projects && (
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            {t("filters.project")}
          </label>
          <Select
            value={filters.project ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, project: value })
            }
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder={t("filters.allProjects")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allProjects")}</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          {t("filters.reset")}
        </Button>
      )}
    </div>
  );
}

// Helper function to filter feedbacks based on filters
export function applyFeedbackFilters<
  T extends {
    feedbackType: string;
    priority: string;
    assignedTo?: Id<"users">;
    deviceInfo?: { device: string; browser: { name: string } };
    projectId?: Id<"projects">;
  }
>(
  feedbacks: T[],
  filters: FeedbackFiltersState,
  currentUserId?: Id<"users">
): T[] {
  return feedbacks.filter((feedback) => {
    // Type filter
    if (filters.type !== "all" && feedback.feedbackType !== filters.type) {
      return false;
    }

    // Priority filter
    if (filters.priority !== "all" && feedback.priority !== filters.priority) {
      return false;
    }

    // Assignee filter
    if (filters.assignee !== "all") {
      if (filters.assignee === "me") {
        if (feedback.assignedTo !== currentUserId) return false;
      } else if (filters.assignee === "unassigned") {
        if (feedback.assignedTo !== undefined) return false;
      } else {
        if (feedback.assignedTo !== filters.assignee) return false;
      }
    }

    // Device filter
    if (filters.device !== "all") {
      if (!feedback.deviceInfo || feedback.deviceInfo.device !== filters.device) {
        return false;
      }
    }

    // Browser filter
    if (filters.browser !== "all") {
      if (!feedback.deviceInfo) return false;
      const browserName = feedback.deviceInfo.browser.name.toLowerCase();
      if (filters.browser === "chrome") {
        if (!browserName.includes("chrome") || browserName.includes("headless")) return false;
      } else if (filters.browser === "safari") {
        if (!browserName.includes("safari") || browserName.includes("chrome")) return false;
      } else if (filters.browser === "firefox") {
        if (!browserName.includes("firefox")) return false;
      } else if (filters.browser === "edge") {
        if (!browserName.includes("edge")) return false;
      } else if (filters.browser === "other") {
        const knownBrowsers = ["chrome", "safari", "firefox", "edge"];
        if (knownBrowsers.some((b) => browserName.includes(b))) return false;
      }
    }

    // Project filter (for inbox)
    if (filters.project && filters.project !== "all") {
      if (feedback.projectId !== filters.project) return false;
    }

    return true;
  });
}
