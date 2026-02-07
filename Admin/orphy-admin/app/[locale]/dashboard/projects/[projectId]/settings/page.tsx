"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWorkspace } from "@/contexts/workspace-context";

const WIDGET_URL =
  process.env.NEXT_PUBLIC_WIDGET_URL || "https://widget.orphy.app/v1/orphy.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace } = useWorkspace();

  const project = useQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);

  // Check if project belongs to current workspace
  const hasAccess = project?.workspaceId === currentWorkspace?._id;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Update form when project changes
  if (project && !formInitialized) {
    setName(project.name);
    setUrl(project.url);
    setClientName(project.clientName ?? "");
    setClientEmail(project.clientEmail ?? "");
    setClientCompany(project.clientCompany ?? "");
    setFormInitialized(true);
  }

  const isLoading = project === undefined || !currentWorkspace;

  // Convex HTTP Actions URL for the widget API
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://decisive-llama-265.convex.site";
  const apiUrl = `${convexSiteUrl}/api/feedback/batch`;

  const embedCode = `<!-- Orphy Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${WIDGET_URL}';
    script.async = true;
    script.onload = function() {
      Orphy.init({
        projectId: '${projectId}',
        apiUrl: '${apiUrl}',
        locale: 'fr'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSaving(true);
    try {
      await updateProject({
        projectId: projectId as Id<"projects">,
        name: name.trim(),
        url: url.trim(),
        clientName: clientName.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientCompany: clientCompany.trim() || undefined,
      });
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("projects.deleteConfirm"))) return;

    setIsDeleting(true);
    try {
      await deleteProject({ projectId: projectId as Id<"projects"> });
      router.push(`/${locale}/dashboard/projects`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("projects.settings")}</h1>
      </div>

      {/* Project Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{t("projects.settings")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
            <Separator className="my-4" />
            <div className="space-y-4">
              <p className="text-sm font-medium">{t("projects.clientSection")}</p>
              <div className="grid gap-2">
                <Label htmlFor="clientName">{t("projects.clientName")}</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t("projects.clientNamePlaceholder")}
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clientCompany">{t("projects.clientCompany")}</Label>
                <Input
                  id="clientCompany"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder={t("projects.clientCompanyPlaceholder")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("projects.clientInternalHint")}
              </p>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("common.loading") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.embedCode")}</CardTitle>
          <CardDescription>
            Copiez ce code et collez-le dans le HTML de votre site, juste avant
            la balise &lt;/body&gt;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{embedCode}</code>
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("projects.codeCopied")}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("projects.copyCode")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Ces actions sont irréversibles. Procédez avec prudence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("projects.delete")}</p>
              <p className="text-sm text-muted-foreground">
                {t("projects.deleteConfirm")}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? t("common.loading") : t("projects.delete")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
