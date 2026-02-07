# Orphy - Web Feedback Widget

## Overview

Orphy is a **lightweight web feedback widget** designed for digital agencies.

It allows clients to give **clear, contextual feedback directly on a live website**, without:
- screenshots
- long email threads
- ambiguity about what is being commented

The core idea is simple:
> **Click on the website → write feedback → the agency understands immediately.**

No CRM.
No project management.
No email replacement.
Just **web feedback done right**.

---

## Problem Statement

In most agencies today:
- Clients take screenshots
- Paste them into emails
- Write comments without precise context
- Mix feedback with other requests

This leads to:
- lost context
- misunderstandings
- time wasted
- unnecessary back-and-forth

Email is not designed for **visual, contextual feedback on websites**.

---

## Product Scope

This project focuses **only** on:
- website feedback during pre-production or review phases

It explicitly does **not** handle:
- CRM
- task management
- billing
- timelines

This is a **single job-to-be-done product**.

---

## Current Features

### Widget (Client-Facing)

| Feature | Status |
|---------|--------|
| Click on any element to leave feedback | ✅ |
| Precise element positioning (bounding box, viewport) | ✅ |
| Smart CSS selector generation | ✅ |
| Visual highlight on hover/selection | ✅ |
| Comment box with keyboard shortcuts (Esc, Ctrl+Enter) | ✅ |
| Feedback types: Bug, Design, Content, Question | ✅ |
| Review mode: see all existing feedbacks | ✅ |
| Threads panel: view conversation history | ✅ |
| Reply to agency messages | ✅ |
| Validate treated feedbacks | ✅ |
| Device/browser detection | ✅ |
| Localization (FR, EN) | ✅ |
| Toggle toolbar | ✅ |

### Admin Dashboard (Agency-Facing)

| Feature | Status |
|---------|--------|
| Authentication (Clerk) | ✅ |
| Workspace/team management | ✅ |
| Team invitations via email | ✅ |
| Multiple projects per workspace | ✅ |
| Feedbacks inbox with filters | ✅ |
| Two-step workflow: Open → Treated → Validated | ✅ |
| Assignee management | ✅ |
| Priority levels (Low, Medium, High) | ✅ |
| Threads/replies to clients | ✅ |
| Resolution notes | ✅ |
| Notification badge for open feedbacks | ✅ |
| Email notifications (hourly batch) | ✅ |
| Device/browser info display | ✅ |
| Multi-language (FR, EN) | ✅ |

### Notifications

| Feature | Status |
|---------|--------|
| Email: New feedback → Agency (hourly batch) | ✅ |
| Email: Workspace invitation | ✅ |
| In-app: Badge for open feedbacks | ✅ |
| Email: Feedback treated → Client | ❌ Planned |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SITE                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Orphy Widget                          │ │
│  │  • Overlay layer (z-index: 999998)                      │ │
│  │  • Highlight box (z-index: 999997)                      │ │
│  │  • Comment box / Threads panel (z-index: 999999)        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                          │
│  • Feedbacks CRUD                                           │
│  • Replies/Threads                                          │
│  • Projects & Workspaces                                    │
│  • User management                                          │
│  • Cron jobs (email notifications)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Realtime sync
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│  • Next.js 15 + React 19                                    │
│  • Clerk authentication                                     │
│  • shadcn/ui components                                     │
│  • Tailwind CSS v4                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Transactional emails
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        RESEND                                │
│  • New feedback notifications                               │
│  • Workspace invitations                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Widget
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite (IIFE output)
- **Package manager**: pnpm
- **Size**: ~15KB minified
- **Dependencies**: Zero runtime dependencies

### Admin Dashboard
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + shadcn/ui + Tailwind CSS v4
- **Database**: Convex (realtime)
- **Auth**: Clerk
- **Emails**: Resend
- **Package manager**: Bun
- **Hosting**: Vercel (planned)

---

## Folder Structure

```
Reviewly/
├── Widget/
│   └── Orphy/
│       ├── src/
│       │   ├── core/
│       │   │   ├── state.ts        # Pub/sub store
│       │   │   ├── overlay.ts      # Click capture layer
│       │   │   ├── highlight.ts    # Visual highlight
│       │   │   └── capture.ts      # Element position capture
│       │   ├── ui/
│       │   │   ├── toolbar.ts      # Toggle button
│       │   │   ├── comment-box.ts  # Feedback input
│       │   │   └── threads-panel.ts # Review mode panel
│       │   ├── utils/
│       │   │   ├── selectors.ts    # CSS selector generation
│       │   │   ├── dom.ts          # DOM helpers
│       │   │   └── viewport.ts     # Viewport detection
│       │   ├── i18n/               # Translations (fr, en)
│       │   └── index.ts            # Entry point
│       ├── dist/                   # Built widget
│       └── test.html               # Manual testing
│
├── Admin/
│   └── orphy-admin/
│       ├── app/                    # Next.js App Router
│       │   └── [locale]/
│       │       ├── dashboard/      # Protected routes
│       │       └── (auth)/         # Auth routes
│       ├── components/             # React components
│       ├── convex/                 # Convex functions
│       │   ├── feedbacks.ts
│       │   ├── projects.ts
│       │   ├── workspaces.ts
│       │   ├── invitations.ts
│       │   ├── notifications.ts
│       │   └── crons.ts
│       └── contexts/               # React contexts
│
└── docs/                           # Documentation
```

---

## Feedback Workflow

```
┌──────────┐     ┌──────────┐     ┌────────────┐
│   OPEN   │ ──► │ TREATED  │ ──► │ VALIDATED  │
└──────────┘     └──────────┘     └────────────┘
     │                │                  │
     │                │                  │
  Client           Agency            Client
  creates          resolves         confirms
  feedback         issue            it's done
```

1. **Open**: Client leaves feedback via widget
2. **Treated**: Agency marks as treated (with optional note)
3. **Validated**: Client confirms the fix via widget

---

## Widget Integration

```html
<script src="https://orphy.app/widget/orphy.js"></script>
<script>
  Orphy.init({
    projectId: 'your-project-id',
    locale: 'fr' // or 'en'
  });
</script>
```

### Public API

```typescript
Orphy.init(options)    // Initialize widget
Orphy.toggle()         // Toggle review mode
Orphy.isActive()       // Check if active
Orphy.getFeedbacks()   // Get current feedbacks
Orphy.destroy()        // Remove widget
```

---

## Design Principles

1. **Overlay only**: Never modify the underlying website DOM
2. **Non-intrusive**: Scrolling and navigation work normally
3. **Context over precision**: Capture enough context, not perfect selectors
4. **Graceful degradation**: Work even when selectors fail
5. **Zero configuration**: Clients don't need to configure anything

---

## Guiding Principle

> If a developer can understand and fix a feedback item
> **without asking a single clarification question**,
> the product succeeds.

Everything else is secondary.

---

## Roadmap

### Done
- [x] Core widget with click capture
- [x] Admin dashboard with authentication
- [x] Workspace/team management
- [x] Two-step validation workflow
- [x] Email notifications (new feedback)
- [x] Threads/replies
- [x] Notification badge

### Planned
- [ ] Production deployment (Vercel)
- [ ] Email: Notify client when feedback treated
- [ ] Widget color customization
- [ ] Export CSV

### Maybe Later
- [ ] Screenshot capture (optional)
- [ ] Slack integration
- [ ] Analytics dashboard

---

## Status

**MVP Complete** - Ready for pilot testing with agencies.

Current focus: Distribution and user feedback.
