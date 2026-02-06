/**
 * English translations
 */

import type { TranslationKeys } from "./fr";

export const en: TranslationKeys = {
  // Comment box
  commentBox: {
    headerNew: "What would you like to report?",
    headerExisting: "Feedback on this element",
    placeholder: "Describe your feedback...",
    cancel: "Cancel",
    submit: "Add",
    submitExisting: "Save",
    addAnother: "Add another feedback",
    hint: "⌘Enter to submit, Esc to cancel",
  },

  // Feedback types
  types: {
    bug: "Bug",
    design: "Design",
    content: "Content",
    question: "Question",
  },

  // Review panel
  reviewPanel: {
    title: "Your feedback",
    subtitle: "Review and submit your annotations",
    empty: "No feedback yet",
    emptyHint: "Click on elements to annotate them",
    submit: "Submit",
    submitCount: "Submit ({{count}})",
    cancel: "Cancel",
    sending: "Sending...",
  },

  // Toast messages
  toast: {
    successSingle: "Feedback sent!",
    successMultiple: "{{count}} feedbacks sent!",
    error: "Failed to send",
    retry: "Retry",
  },

  // Toolbar
  toolbar: {
    feedback: "Feedback",
    done: "Done",
    review: "Review",
    messages: "Messages",
  },

  // Replay mode
  replay: {
    status: {
      open: "Open",
      resolved: "Resolved",
    },
    close: "Close",
    resolve: "Mark resolved",
    resolving: "Resolving...",
    resolved: "Resolved!",
    hint: "Press Esc to close",
    notePlaceholder: "Describe what was done...",
    noteHint: "Note included in client summary",
    viewport: "{{width}}×{{height}} • {{device}}",
    device: {
      desktop: "Desktop",
      mobile: "Mobile",
      tablet: "Tablet",
    },
    timeAgo: {
      now: "Just now",
      minutes: "{{count}}m ago",
      hours: "{{count}}h ago",
      days: "{{count}}d ago",
      weeks: "{{count}}w ago",
    },
    fallback: {
      notFound: "Element not found on this page",
      loadError: "Failed to load feedback",
      close: "Close",
    },
  },

  // Thread panel (bidirectional comments)
  thread: {
    author: {
      client: "Client",
      agency: "Agency",
    },
    anonymous: "Anonymous",
    replyPlaceholder: "Write a reply...",
    send: "Send",
    sending: "Sending...",
    noReplies: "No replies yet",
    // Validation workflow
    status: {
      open: "Pending",
      treated: "Treated",
      validated: "Validated",
    },
    validateInfo: "The agency has addressed this feedback. Confirm if it's resolved:",
    validate: "Validate",
    validating: "Validating...",
    validated: "Validated!",
  },

  // Minimized bar
  minimizedBar: {
    expand: "Expand",
    previous: "Previous",
    next: "Next",
    minimize: "Minimize",
  },
} as const;
