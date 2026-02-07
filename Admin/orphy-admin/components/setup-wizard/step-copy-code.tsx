"use client";

import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WIDGET_URL =
  process.env.NEXT_PUBLIC_WIDGET_URL || "https://widget.orphy.app/v1/orphy.js";

interface StepCopyCodeProps {
  projectId: string;
  apiUrl: string;
  onNext: () => void;
  onBack: () => void;
}

export function StepCopyCode({
  projectId,
  apiUrl,
  onNext,
  onBack,
}: StepCopyCodeProps) {
  const t = useTranslations("setup");
  const [copied, setCopied] = useState(false);
  const [hasEverCopied, setHasEverCopied] = useState(false);

  const embedCode = `<!-- Orphy Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${WIDGET_URL}';
    script.async = true;
    script.onload = function() {
      Orphy.init({
        projectId: '${projectId}',
        apiUrl: '${apiUrl}',
        locale: 'fr'
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setHasEverCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Code2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t("copyCode.title")}</CardTitle>
        <CardDescription>{t("copyCode.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{embedCode}</code>
          </pre>
          <Button
            variant={copied ? "default" : "outline"}
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t("copyCode.copied")}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {t("steps.copyCode")}
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            {t("back")}
          </Button>
          <Button
            className="flex-1"
            onClick={onNext}
            disabled={!hasEverCopied}
          >
            {t("next")}
          </Button>
        </div>

        {!hasEverCopied && (
          <p className="text-sm text-center text-muted-foreground">
            Copiez le code pour continuer
          </p>
        )}
      </CardContent>
    </Card>
  );
}
