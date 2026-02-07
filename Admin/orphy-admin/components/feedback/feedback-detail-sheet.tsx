"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Bug,
  Palette,
  FileText,
  HelpCircle,
  MessageSquare,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Send,
} from "lucide-react";
import {
  SiGooglechrome,
  SiSafari,
  SiFirefox,
  SiOpera,
  SiBrave,
} from "@icons-pack/react-simple-icons";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

type FeedbackData = Doc<"feedbacks">;

interface FeedbackDetailSheetProps {
  feedback: FeedbackData | null;
  onOpenChange: (open: boolean) => void;
}

function getFeedbackTypeIcon(type: string) {
  switch (type) {
    case "bug":
      return <Bug className="h-4 w-4 text-red-500" />;
    case "design":
      return <Palette className="h-4 w-4 text-purple-500" />;
    case "content":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "question":
      return <HelpCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case "mobile":
      return <Smartphone className="h-3.5 w-3.5" />;
    case "tablet":
      return <Tablet className="h-3.5 w-3.5" />;
    default:
      return <Monitor className="h-3.5 w-3.5" />;
  }
}

function getBrowserIcon(browserName: string) {
  const name = browserName.toLowerCase();
  const iconClass = "h-4 w-4";
  if (name.includes("chrome") && !name.includes("headless"))
    return <SiGooglechrome className={iconClass} color="#4285F4" />;
  if (name.includes("safari"))
    return <SiSafari className={iconClass} color="#006CFF" />;
  if (name.includes("firefox"))
    return <SiFirefox className={iconClass} color="#FF7139" />;
  if (name.includes("opera"))
    return <SiOpera className={iconClass} color="#FF1B2D" />;
  if (name.includes("brave"))
    return <SiBrave className={iconClass} color="#FB542B" />;
  return <Globe className={iconClass} />;
}

export function FeedbackDetailSheet({
  feedback,
  onOpenChange,
}: FeedbackDetailSheetProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";

  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const replies = useQuery(
    api.feedbacks.listReplies,
    feedback ? { feedbackId: feedback._id } : "skip"
  );

  const createReply = useMutation(api.feedbacks.createReply);
  const updateStatus = useMutation(api.feedbacks.updateStatus);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400";
      case "treated":
      case "resolved":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "validated":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const handleChangeStatus = async (
    status: "open" | "treated" | "validated"
  ) => {
    if (!feedback) return;
    try {
      await updateStatus({ feedbackId: feedback._id, status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Scroll to bottom when replies change
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSendReply = async () => {
    if (!feedback || !replyContent.trim()) return;

    setIsSending(true);
    try {
      await createReply({
        feedbackId: feedback._id,
        content: replyContent.trim(),
      });
      setReplyContent("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={!!feedback} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("feedbacks.replies.title")}</SheetTitle>
          <SheetDescription className="sr-only">
            {feedback?.comment}
          </SheetDescription>
        </SheetHeader>

        {feedback && (
          <>
            {/* Feedback details */}
            <div className="px-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {getFeedbackTypeIcon(feedback.feedbackType)}
                  <Badge variant="outline" className="text-xs">
                    {t(`feedbacks.type.${feedback.feedbackType}`)}
                  </Badge>
                </div>
                <Select
                  value={feedback.status === "resolved" ? "treated" : feedback.status}
                  onValueChange={(v) =>
                    handleChangeStatus(v as "open" | "treated" | "validated")
                  }
                >
                  <SelectTrigger
                    className={`w-auto h-6 text-xs border-0 gap-1 px-2 ${getStatusStyle(feedback.status)}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      {t("feedbacks.status.open")}
                    </SelectItem>
                    <SelectItem value="treated">
                      {t("feedbacks.status.treated")}
                    </SelectItem>
                    <SelectItem value="validated">
                      {t("feedbacks.status.validated")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm">{feedback.comment}</p>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>
                  {t("feedbacks.page")}: {new URL(feedback.pageUrl).pathname}
                </span>
                <span>{formatDate(feedback.createdAt)}</span>
                {feedback.deviceInfo && (
                  <span className="flex items-center gap-1.5">
                    {getBrowserIcon(feedback.deviceInfo.browser.name)}
                    {feedback.deviceInfo.browser.name}
                    <span className="text-muted-foreground/50">·</span>
                    {getDeviceIcon(feedback.deviceInfo.device)}
                    {t(
                      `feedbacks.deviceType.${feedback.deviceInfo.device}`
                    )}
                    <span className="text-muted-foreground/50">·</span>
                    {feedback.deviceInfo.screen.width}×
                    {feedback.deviceInfo.screen.height}
                  </span>
                )}
              </div>


            </div>

            <Separator />

            {/* Replies thread */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3 min-h-0">
              {replies && replies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("feedbacks.replies.empty")}
                </p>
              )}

              {replies?.map((reply) => {
                const isAgency = reply.authorType === "agency";
                return (
                  <div
                    key={reply._id}
                    className={`flex flex-col ${isAgency ? "items-end" : "items-start"}`}
                  >
                    <span className="text-xs text-muted-foreground mb-1">
                      {isAgency
                        ? t("feedbacks.replies.you")
                        : reply.authorName ||
                          t("feedbacks.replies.client")}
                      {" · "}
                      {formatDateTime(reply.createdAt)}
                    </span>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                        isAgency
                          ? "bg-primary/10 text-primary"
                          : "bg-muted"
                      }`}
                    >
                      {reply.content}
                    </div>
                  </div>
                );
              })}

              <div ref={repliesEndRef} />
            </div>

            {/* Reply form */}
            <SheetFooter className="border-t pt-4">
              <div className="flex gap-2 w-full">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("feedbacks.replies.placeholder")}
                  className="min-h-[60px] max-h-[120px] resize-none flex-1"
                  disabled={isSending}
                />
                <Button
                  size="icon"
                  onClick={handleSendReply}
                  disabled={isSending || !replyContent.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">
                    {isSending
                      ? t("feedbacks.replies.sending")
                      : t("feedbacks.replies.send")}
                  </span>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
