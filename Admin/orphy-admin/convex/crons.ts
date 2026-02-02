import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Send batched email notifications every hour
crons.interval(
  "send-feedback-notifications",
  { hours: 1 },
  internal.notificationsActions.sendBatchedNotifications
);

export default crons;
