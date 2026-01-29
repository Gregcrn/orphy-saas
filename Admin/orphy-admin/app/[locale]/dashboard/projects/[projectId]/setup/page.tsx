"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWorkspace } from "@/contexts/workspace-context";
import { SetupWizard } from "@/components/setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectSetupPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { currentWorkspace } = useWorkspace();

  const project = useQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });
  const completeSetup = useMutation(api.projects.completeSetup);

  // Convex HTTP Actions URL for the widget API
  const convexSiteUrl =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    "https://decisive-llama-265.convex.site";
  const apiUrl = `${convexSiteUrl}/api/feedback/batch`;

  const isLoading = project === undefined || !currentWorkspace;

  // Check if project belongs to current workspace
  const hasAccess = project?.workspaceId === currentWorkspace?._id;

  const handleComplete = async () => {
    try {
      await completeSetup({ projectId: projectId as Id<"projects"> });
    } catch (error) {
      console.error("Failed to complete setup:", error);
    }
    // Redirect to project page
    router.push(`/${locale}/dashboard/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mx-auto mb-8" />
        <div className="flex items-center justify-center gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              {i < 3 && <Skeleton className="w-24 h-0.5 mx-2" />}
            </div>
          ))}
        </div>
        <Skeleton className="h-96 w-full max-w-lg mx-auto rounded-lg" />
      </div>
    );
  }

  if (!project || !hasAccess) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <SetupWizard
      projectId={projectId}
      projectName={project.name}
      projectUrl={project.url}
      apiUrl={apiUrl}
      hasFirstFeedback={!!project.firstFeedbackAt}
      onComplete={handleComplete}
    />
  );
}
