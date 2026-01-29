"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";

interface MemberRowProps {
  member: {
    _id: Id<"workspaceMembers">;
    role: "owner" | "admin" | "member" | "viewer";
    joinedAt: number;
    user: {
      _id: Id<"users">;
      email: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
    };
  };
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (name[0] ?? "U").toUpperCase();
}

function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "outline" {
  switch (role) {
    case "owner":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

export function MemberRow({ member }: MemberRowProps) {
  const t = useTranslations("team");

  const fullName =
    member.user.firstName && member.user.lastName
      ? `${member.user.firstName} ${member.user.lastName}`
      : member.user.firstName || member.user.email;

  const roleKey = member.role as "owner" | "admin" | "member" | "viewer";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={member.user.imageUrl} alt={fullName} />
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-sm text-muted-foreground">{member.user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(member.role)}>
          {t(`roles.${roleKey}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {t("memberSince", {
          date: new Date(member.joinedAt).toLocaleDateString(),
        })}
      </TableCell>
      <TableCell>
        {/* Actions placeholder - could add remove member, change role, etc. */}
      </TableCell>
    </TableRow>
  );
}
