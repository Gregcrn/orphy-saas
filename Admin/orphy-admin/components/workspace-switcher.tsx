"use client";

import { ChevronsUpDown, Plus, CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWorkspace } from "@/contexts/workspace-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSwitcher() {
  const t = useTranslations();
  const { isMobile } = useSidebar();
  const { workspaces, currentWorkspace, setCurrentWorkspaceId, isLoading } =
    useWorkspace();

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!currentWorkspace) {
    return null;
  }

  const isOwner = currentWorkspace.role === "owner";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-[#D4A373] text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                <CircleDot className="size-4" strokeWidth={2.5} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentWorkspace.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t(`team.roles.${currentWorkspace.role}`)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("workspace.workspaces")}
            </DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace._id}
                onClick={() => setCurrentWorkspaceId(workspace._id)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-sm bg-[#D4A373] text-white">
                  <CircleDot className="size-3 shrink-0" strokeWidth={2.5} />
                </div>
                <div className="flex-1 truncate">{workspace.name}</div>
                {workspace._id === currentWorkspace._id && (
                  <span className="text-xs text-muted-foreground">✓</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 opacity-50" disabled>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                {t("workspace.create")}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
