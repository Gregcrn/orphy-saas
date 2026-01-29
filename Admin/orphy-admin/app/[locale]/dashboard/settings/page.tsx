"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (name[0] ?? "U").toUpperCase();
}

export default function SettingsPage() {
  const t = useTranslations();
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  if (!isLoaded) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "";
  const email = user?.emailAddresses[0]?.emailAddress || "";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Settings Navigation */}
      <div className="flex gap-2 border-b pb-4">
        <Button variant="secondary" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          {t("settings.account")}
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href={`/${locale}/dashboard/settings/team`}>
            <Users className="h-4 w-4" />
            {t("settings.team")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("settings.account")}
          </CardTitle>
          <CardDescription>
            Gérez les informations de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} alt={fullName} />
              <AvatarFallback className="text-lg">
                {getInitials(fullName || email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{fullName || email}</p>
              <p className="text-muted-foreground">{email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Membre depuis{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
