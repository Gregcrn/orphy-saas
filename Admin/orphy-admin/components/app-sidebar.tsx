"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  FolderKanban,
  Settings,
  MessageSquare,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/contexts/workspace-context";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoaded } = useUser();
  const t = useTranslations();
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();

  // Extract locale from pathname
  const locale = pathname.split("/")[1] || "fr";

  // Fetch projects from Convex
  const allProjects = useQuery(api.projects.list);

  // Filter projects by current workspace
  const projects = allProjects?.filter(
    (project) => project.workspaceId === currentWorkspace?._id
  );

  // Navigation items
  const navMain = [
    {
      title: t("sidebar.dashboard"),
      url: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      isActive: pathname === `/${locale}/dashboard`,
    },
    {
      title: t("sidebar.inbox"),
      url: `/${locale}/dashboard/inbox`,
      icon: Inbox,
      isActive: pathname === `/${locale}/dashboard/inbox`,
    },
    {
      title: t("sidebar.projects"),
      url: `/${locale}/dashboard/projects`,
      icon: FolderKanban,
      isActive: pathname.startsWith(`/${locale}/dashboard/projects`),
    },
    {
      title: t("sidebar.settings"),
      url: `/${locale}/dashboard/settings`,
      icon: Settings,
      isActive: pathname.startsWith(`/${locale}/dashboard/settings`),
    },
  ];

  // Transform projects for NavProjects component
  const projectItems =
    projects?.map((project) => ({
      id: project._id,
      name: project.name,
      url: `/${locale}/dashboard/projects/${project._id}`,
      icon: MessageSquare,
    })) ?? [];

  // User data for NavUser
  const userData = {
    name:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.emailAddresses[0]?.emailAddress || "",
    email: user?.emailAddresses[0]?.emailAddress || "",
    avatar: user?.imageUrl || "",
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projectItems} locale={locale} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
