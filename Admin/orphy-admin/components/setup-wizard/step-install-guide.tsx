"use client";

import { FileCode2, Globe, ShoppingBag, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepInstallGuideProps {
  onNext: () => void;
  onBack: () => void;
}

const platformIcons = {
  html: FileCode2,
  wordpress: Globe,
  webflow: Layers,
  shopify: ShoppingBag,
};

export function StepInstallGuide({ onNext, onBack }: StepInstallGuideProps) {
  const t = useTranslations("setup");

  const platforms = ["html", "wordpress", "webflow", "shopify"] as const;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <FileCode2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t("install.title")}</CardTitle>
        <CardDescription>{t("install.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform];
            return (
              <div
                key={platform}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">{t(`install.tips.${platform}`)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(`install.tips.${platform}Description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> Le code doit être placé juste avant la
            balise <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{"</body>"}</code> pour
            fonctionner correctement.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            {t("back")}
          </Button>
          <Button className="flex-1" onClick={onNext}>
            {t("next")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
