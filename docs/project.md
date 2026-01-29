# Web Feedback Widget

## Overview

This project is a **lightweight web feedback widget** designed for digital agencies.

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
- Mix feedback with other requests (calls, deadlines, questions)

This leads to:
- lost context
- misunderstandings
- time wasted
- unnecessary back-and-forth

Email is not designed for **visual, contextual feedback on websites**.

---

## Product Scope (Strict)

This project focuses **only** on:
- website feedback during pre-production or review phases

It explicitly does **not** handle:
- CRM
- task management
- billing
- timelines
- team management

This is a **single job-to-be-done product**.

---

## How It Works (High Level)

1. An agency generates a **review link**
2. The client opens the website in **review mode**
3. The client:
   - clicks on any element
   - writes a comment
4. The agency receives:
   - the comment
   - the exact page
   - the element location
   - viewport information

The goal is that **a developer can fix the issue without asking a follow-up question**.

---

## Architecture Overview

The system is intentionally split into three independent parts:

### 1. Widget (Core Value)
- Standalone JavaScript widget
- Injected on top of any website
- No framework (DOM API only)
- Handles:
  - click capture
  - element highlighting
  - comment UI
  - data serialization

This is the heart of the product.

### 2. Application (Next.js)
- Dashboard for agencies
- Review link generation
- Feedback listing & status tracking
- API routes

### 3. Backend
- Simple REST API
- Stores feedback data
- No real-time or heavy logic in MVP

---

## Widget Design Principles

- **Overlay only** (never modify the underlying website)
- **Non-intrusive** (scrolling and navigation must work normally)
- **Context over precision**
- **Graceful degradation** over perfect DOM targeting
- **Zero configuration** for the client

---

## Folder Structure (Widget)

src/
├── core/
│ ├── capture.ts # Click & position capture
│ ├── highlight.ts # Visual highlight logic
│ ├── overlay.ts # Overlay layer management
│ └── state.ts # Local widget state
├── ui/
│ ├── comment-box.ts # Feedback input UI
│ └── toolbar.ts # Review mode controls
├── utils/
│ ├── dom.ts # DOM helpers
│ ├── selectors.ts # Element selector utilities
│ └── viewport.ts # Viewport detection
├── styles/
│ ├── overlay.css
│ └── comment-box.css
└── index.ts # Widget entry point


---

## Technical Choices (MVP)

- **TypeScript**
- **Vite** (library mode, IIFE output)
- **pnpm**
- **No framework inside the widget**
- **No WebSockets**
- **No WASM / Rust**
- **No over-engineering**

The priority is **time-to-feedback**, not technical novelty.

---

## Non-Goals (Important)

This project does NOT aim to:
- be a Figma competitor
- handle full collaboration workflows
- support complex annotations or design tools
- replace existing PM tools

It is intentionally narrow.

---

## Guiding Principle

> If a developer can understand and fix a feedback item  
> **without asking a single clarification question**,  
> the product succeeds.

Everything else is secondary.

---

## Status

Early MVP.  
Focus: validate real agency usage before expanding scope.
