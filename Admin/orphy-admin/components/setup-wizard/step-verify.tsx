"use client";

import { ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepVerifyProps {
  projectUrl: string;
  hasFirstFeedback: boolean;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepVerify({
  projectUrl,
  hasFirstFeedback,
  onComplete,
  onBack,
  onSkip,
}: StepVerifyProps) {
  const t = useTranslations("setup");

  const handleOpenSite = () => {
    // Open the site with a test parameter
    const url = new URL(projectUrl);
    url.searchParams.set("orphy_test", "true");
    window.open(url.toString(), "_blank");
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {hasFirstFeedback ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          )}
        </div>
        <CardTitle className="text-2xl">{t("verify.title")}</CardTitle>
        <CardDescription>{t("verify.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasFirstFeedback ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              {t("verify.success")}
            </p>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleOpenSite}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("verify.openSite")}
            </Button>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("verify.waiting")}
              </span>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            {t("back")}
          </Button>
          {hasFirstFeedback ? (
            <Button className="flex-1" onClick={onComplete}>
              {t("complete")}
            </Button>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={onSkip}>
              {t("verify.skip")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
