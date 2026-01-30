"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { CheckCircle2, MessageSquare } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ResolveDialogProps {
  feedbackId: Id<"feedbacks">;
  feedbackComment: string;
  initialNote?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
}

export function ResolveDialog({
  feedbackId,
  feedbackComment,
  initialNote = "",
  open,
  onOpenChange,
  onResolved,
}: ResolveDialogProps) {
  const t = useTranslations();
  const [note, setNote] = useState(initialNote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync note when dialog opens or initialNote changes
  useEffect(() => {
    if (open) {
      setNote(initialNote);
    }
  }, [open, initialNote]);

  const markAsTreated = useMutation(api.feedbacks.markAsTreated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await markAsTreated({
        feedbackId,
        resolutionNote: note.trim() || undefined,
      });
      setNote("");
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      console.error("Failed to resolve feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t("feedbacks.resolution.title")}
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-start gap-2 mt-2 p-3 bg-muted rounded-lg text-sm">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{feedbackComment}</span>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-note">
                {t("feedbacks.resolution.noteLabel")}
              </Label>
              <Textarea
                id="resolution-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("feedbacks.resolution.notePlaceholder")}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t("feedbacks.resolution.noteHint")}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isSubmitting
                ? t("common.loading")
                : t("feedbacks.resolution.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
