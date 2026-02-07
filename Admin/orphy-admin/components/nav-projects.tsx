"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, type LucideIcon } from "lucide-react";

import { Id } from "@/convex/_generated/dataModel";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
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
    badge?: number;
  }[];
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();

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
            {item.badge !== undefined && item.badge > 0 && (
              <SidebarMenuBadge className="bg-red-500 text-white hover:text-white peer-hover/menu-button:text-white peer-data-[active=true]/menu-button:text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </SidebarMenuBadge>
            )}
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
