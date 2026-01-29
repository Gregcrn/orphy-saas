"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepProjectCreatedProps {
  projectName: string;
  projectUrl: string;
  onNext: () => void;
}

export function StepProjectCreated({
  projectName,
  projectUrl,
  onNext,
}: StepProjectCreatedProps) {
  const t = useTranslations("setup");

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t("projectCreated.title")}</CardTitle>
        <CardDescription>{t("projectCreated.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("steps.created")}
            </span>
            <span className="font-medium">{projectName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">URL</span>
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              {new URL(projectUrl).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={onNext}>
          {t("next")}
        </Button>
      </CardContent>
    </Card>
  );
}
