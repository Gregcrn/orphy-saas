"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Plus, ExternalLink, Settings, User, Circle, CheckCircle2, Globe, FolderKanban, Calendar } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/contexts/workspace-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace } = useWorkspace();

  const allProjects = useQuery(api.projects.list);
  const feedbacks = useQuery(api.feedbacks.listAll, {});
  const createProject = useMutation(api.projects.create);

  // Filter projects by current workspace
  const projects = allProjects?.filter(
    (project) => project.workspaceId === currentWorkspace?._id
  ) ?? [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open dialog if ?new=true in URL
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsDialogOpen(true);
      router.replace(`/${locale}/dashboard/projects`);
    }
  }, [searchParams, router, locale]);

  const isLoading = allProjects === undefined || !currentWorkspace;

  // Get feedback stats per project
  const getFeedbackStats = (projectId: string) => {
    const projectFeedbacks = feedbacks?.filter((f) => f.projectId === projectId) ?? [];
    const total = projectFeedbacks.length;
    const open = projectFeedbacks.filter((f) => f.status === "open").length;
    const resolved = projectFeedbacks.filter((f) => f.status === "resolved").length;
    return { total, open, resolved };
  };

  // Get favicon URL using Google's favicon service
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || !clientName.trim() || !clientEmail.trim() || !clientCompany.trim()) return;

    setIsSubmitting(true);
    try {
      const projectId = await createProject({
        name: name.trim(),
        url: url.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim(),
      });
      setName("");
      setUrl("");
      setClientName("");
      setClientEmail("");
      setClientCompany("");
      setIsDialogOpen(false);
      // Redirect to setup wizard for the new project
      router.push(`/${locale}/dashboard/projects/${projectId}/setup`);
    } catch (error) {
      console.error("Failed to create project:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("projects.title")}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="border-t bg-muted/30 px-5 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="border-t px-5 py-3">
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("projects.title")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("projects.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t("projects.new")}</DialogTitle>
                <DialogDescription>
                  {t("dashboard.empty.noProjectsDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("projects.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("projects.namePlaceholder")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">{t("projects.url")}</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("projects.urlPlaceholder")}
                    required
                  />
                </div>

                {/* Client Contact Section */}
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">{t("projects.clientSection")}</p>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="clientName">{t("projects.clientName")}</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder={t("projects.clientNamePlaceholder")}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clientEmail">{t("projects.clientEmail")}</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder={t("projects.clientEmailPlaceholder")}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clientCompany">{t("projects.clientCompany")}</Label>
                      <Input
                        id="clientCompany"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        placeholder={t("projects.clientCompanyPlaceholder")}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("projects.clientInternalHint")}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("common.loading") : t("common.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t("dashboard.empty.noProjects")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("dashboard.empty.noProjectsDescription")}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("projects.new")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const stats = getFeedbackStats(project._id);
            const faviconUrl = getFaviconUrl(project.url);

            return (
              <Card key={project._id} className="group relative hover:shadow-lg transition-all hover:border-foreground/20 overflow-hidden">
                <Link href={`/${locale}/dashboard/projects/${project._id}`}>
                  <CardContent className="p-0">
                    {/* Header with favicon */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border border-border/50">
                          {faviconUrl ? (
                            <img
                              src={faviconUrl}
                              alt=""
                              className="w-7 h-7"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement?.querySelector(".fallback-icon")?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <Globe className={`h-6 w-6 text-muted-foreground fallback-icon ${faviconUrl ? "hidden" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-semibold text-base leading-tight truncate">{project.name}</h3>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            {project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Client section */}
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {project.clientName ? (
                          <div className="truncate">
                            <span className="font-medium">{project.clientName}</span>
                            {project.clientCompany && (
                              <span className="text-muted-foreground"> · {project.clientCompany}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">{t("projects.clientNotConfigured")}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats section */}
                    <div className="border-t bg-muted/30 px-5 py-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400">{stats.open}</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
                            {t("feedbacks.status.open")}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{stats.resolved}</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {t("feedbacks.status.resolved")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {t("projects.created", { date: formatDate(project._creationTime) })}
                      </span>
                    </div>
                  </CardContent>
                </Link>

                {/* Settings button */}
                <Link
                  href={`/${locale}/dashboard/projects/${project._id}/settings`}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
