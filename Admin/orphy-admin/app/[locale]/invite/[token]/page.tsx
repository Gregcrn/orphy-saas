"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>;
}) {
  const { token, locale } = use(params);
  const t = useTranslations("invite");
  const tTeam = useTranslations("team");
  const tAuth = useTranslations("auth");
  const router = useRouter();

  const { user, isLoaded: isUserLoaded } = useUser();
  const invitation = useQuery(api.invitations.getByToken, { token });
  const acceptMutation = useMutation(api.invitations.accept);

  // Check if the Convex user exists (might be delayed after Clerk signup)
  const convexUser = useQuery(api.users.getCurrentUser);

  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  // Wait for Clerk user, invitation data, AND Convex user sync (if logged in)
  const isLoading = !isUserLoaded || invitation === undefined || (user && convexUser === undefined);

  const handleAccept = async () => {
    setIsAccepting(true);
    setAcceptError(null);

    try {
      const result = await acceptMutation({ token });
      setIsAccepted(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("different email")) {
        setAcceptError(
          t("wrongEmailDescription", { email: invitation?.email ?? "" })
        );
      } else {
        setAcceptError(t("error"));
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation not found
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("notFound")}</CardTitle>
            <CardDescription>{t("notFoundDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check invitation status
  const isExpired =
    invitation.status === "expired" || Date.now() > invitation.expiresAt;
  const isRevoked = invitation.status === "revoked";
  const isAlreadyAccepted = invitation.status === "accepted";

  // Expired invitation
  if (isExpired && invitation.status !== "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>{t("expired")}</CardTitle>
            <CardDescription>{t("expiredDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Revoked invitation
  if (isRevoked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("revoked")}</CardTitle>
            <CardDescription>{t("revokedDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (isAlreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>{t("alreadyAccepted")}</CardTitle>
            <CardDescription>{t("alreadyAcceptedDescription")}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push(`/${locale}/dashboard`)}>
              {t("goToDashboard")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Successfully accepted (just now)
  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>{t("success")}</CardTitle>
            <CardDescription>
              {invitation.workspace?.name}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push(`/${locale}/dashboard`)}>
              {t("goToDashboard")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get inviter name
  const inviterName = invitation.inviter
    ? invitation.inviter.firstName && invitation.inviter.lastName
      ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
      : invitation.inviter.firstName || invitation.inviter.email
    : "Someone";

  // Not authenticated - show sign in / sign up
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>
              {t("invitedBy", { name: inviterName })}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-semibold mb-2">
              {invitation.workspace?.name}
            </p>
            <p className="text-muted-foreground">
              {t("asRole", { role: tTeam(`roles.${invitation.role}`) })}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground text-center mb-2">
              {t("signInDescription")}
            </p>
            <div className="flex gap-3 w-full">
              <SignInButton
                mode="modal"
                forceRedirectUrl={`/${locale}/invite/${token}`}
              >
                <Button variant="outline" className="flex-1">
                  {tAuth("signIn")}
                </Button>
              </SignInButton>
              <SignUpButton
                mode="modal"
                forceRedirectUrl={`/${locale}/invite/${token}`}
              >
                <Button className="flex-1">
                  {tAuth("signUp")}
                </Button>
              </SignUpButton>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Authenticated but Convex user not synced yet (webhook in progress)
  if (!convexUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t("syncingAccount")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - check email match
  const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
  const invitationEmail = invitation.email.toLowerCase();
  const emailMatches = userEmail === invitationEmail;

  // Wrong email
  if (!emailMatches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>{t("wrongEmail")}</CardTitle>
            <CardDescription>
              {t("wrongEmailDescription", { email: invitation.email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Vous êtes connecté en tant que <strong>{userEmail}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated with correct email - show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("invitedBy", { name: inviterName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-2xl font-semibold mb-2">
            {invitation.workspace?.name}
          </p>
          <p className="text-muted-foreground">
            {t("asRole", { role: tTeam(`roles.${invitation.role}`) })}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {acceptError && (
            <p className="text-sm text-destructive text-center">{acceptError}</p>
          )}
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full"
            size="lg"
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("accepting")}
              </>
            ) : (
              t("accept")
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
