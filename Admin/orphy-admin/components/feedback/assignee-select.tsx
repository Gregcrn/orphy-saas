"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { UserCircle2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AssigneeSelectProps {
  feedbackId: Id<"feedbacks">;
  currentAssignee?: Id<"users">;
  workspaceId: Id<"workspaces">;
}

export function AssigneeSelect({
  feedbackId,
  currentAssignee,
  workspaceId,
}: AssigneeSelectProps) {
  const t = useTranslations("feedbacks");
  const membersQuery = useQuery(api.workspaces.getMembers, { workspaceId });
  const assignTo = useMutation(api.feedbacks.assignTo);

  // Filter out any null members (shouldn't happen but TypeScript requires it)
  const members = membersQuery?.filter(
    (m): m is NonNullable<typeof m> => m !== null
  );

  const handleAssign = async (value: string) => {
    const assignedTo = value === "unassigned" ? undefined : (value as Id<"users">);
    await assignTo({ feedbackId, assignedTo });
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

  const currentMember = members?.find((m) => m.user._id === currentAssignee);

  return (
    <Select
      value={currentAssignee ?? "unassigned"}
      onValueChange={handleAssign}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue>
          {currentMember ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {currentMember.user.imageUrl && (
                  <AvatarImage src={currentMember.user.imageUrl} />
                )}
                <AvatarFallback>
                  {getInitials(
                    currentMember.user.firstName,
                    currentMember.user.lastName,
                    currentMember.user.email
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {currentMember.user.firstName ?? currentMember.user.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCircle2 className="h-4 w-4" />
              <span>{t("unassigned")}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            <span>{t("unassigned")}</span>
          </div>
        </SelectItem>
        {members?.map((member) => (
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
  );
}
