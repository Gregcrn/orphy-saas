"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Folder,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavProjects({
  projects,
  locale,
}: {
  projects: {
    id: Id<"projects">;
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  locale: string;
}) {
  const { isMobile } = useSidebar();
  const t = useTranslations();
  const router = useRouter();
  const deleteProject = useMutation(api.projects.remove);

  const handleDelete = async (projectId: Id<"projects">) => {
    if (confirm(t("projects.deleteConfirm"))) {
      await deleteProject({ projectId });
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("sidebar.projects")}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">{t("common.actions")}</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem asChild>
                  <Link href={item.url}>
                    <Folder className="text-muted-foreground" />
                    <span>{t("projects.viewProject")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${item.url}/settings`}>
                    <Settings className="text-muted-foreground" />
                    <span>{t("projects.settings")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="text-destructive" />
                  <span>{t("projects.delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-sidebar-foreground/70"
            onClick={() => router.push(`/${locale}/dashboard/projects?new=true`)}
          >
            <Plus className="text-sidebar-foreground/70" />
            <span>{t("projects.new")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
