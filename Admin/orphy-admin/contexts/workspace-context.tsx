"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Workspace = {
  _id: Id<"workspaces">;
  name: string;
  role: string | null;
  plan?: string;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: Id<"workspaces">) => void;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

const STORAGE_KEY = "orphy-current-workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspacesRaw = useQuery(api.workspaces.list);
  // Filter out any null values and cast to proper type
  const workspaces = workspacesRaw?.filter((w): w is NonNullable<typeof w> => w !== null);
  const [currentWorkspaceId, setCurrentWorkspaceId] =
    useState<Id<"workspaces"> | null>(null);

  // Load saved workspace from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCurrentWorkspaceId(saved as Id<"workspaces">);
    }
  }, []);

  // Set default workspace when workspaces load
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspaceId) {
      // Prefer owner workspace, fallback to first
      const ownerWorkspace = workspaces.find((w) => w.role === "owner");
      const defaultWorkspace = ownerWorkspace || workspaces[0];
      if (defaultWorkspace) {
        setCurrentWorkspaceId(defaultWorkspace._id);
      }
    }
  }, [workspaces, currentWorkspaceId]);

  // Validate that saved workspace still exists
  useEffect(() => {
    if (workspaces && currentWorkspaceId) {
      const exists = workspaces.some((w) => w._id === currentWorkspaceId);
      if (!exists && workspaces.length > 0) {
        // Saved workspace no longer accessible, reset to default
        const defaultWorkspace = workspaces[0];
        if (defaultWorkspace) {
          setCurrentWorkspaceId(defaultWorkspace._id);
        }
      }
    }
  }, [workspaces, currentWorkspaceId]);

  const handleSetCurrentWorkspaceId = (id: Id<"workspaces">) => {
    setCurrentWorkspaceId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const currentWorkspace =
    workspaces?.find((w) => w._id === currentWorkspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: workspaces ?? [],
        currentWorkspace,
        setCurrentWorkspaceId: handleSetCurrentWorkspaceId,
        isLoading: workspaces === undefined,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
