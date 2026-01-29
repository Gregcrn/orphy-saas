# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orphy is a web feedback widget for digital agencies. Clients click elements on a live website, write comments, and agencies receive precise context (element, position, viewport) without screenshots or email threads.

**Architecture**: Monorepo with two independent projects:
- `Widget/Orphy/` - Standalone JavaScript widget (vanilla TypeScript, IIFE bundle)
- `Admin/` - Next.js dashboard for agencies (React 19, Tailwind v4, Convex, Clerk)

## Commands

### Widget (Widget/Orphy/)
```bash
cd Widget/Orphy
pnpm dev        # Watch mode build
pnpm build      # Type-check + production build
pnpm typecheck  # Type-check only
```

**Manual testing**: Open `test.html` in browser after building (loads `dist/orphy.js`)

### Admin Dashboard (Admin/)
```bash
cd Admin
bun dev         # Next.js dev server (localhost:3000)
bun run build   # Production build
bun run lint    # ESLint
bunx shadcn@latest add <component>  # Add shadcn/ui components
```

## Widget Architecture

The widget injects an overlay on any website without modifying the underlying DOM.

**Core modules** (`src/core/`):
- `state.ts` - Pub/sub store for widget state and feedback collection
- `overlay.ts` - Transparent fixed overlay for click capture via `elementFromPoint`
- `highlight.ts` - Visual highlight box using `requestAnimationFrame` for performance
- `capture.ts` - Element position, CSS selector generation, viewport data

**UI components** (`src/ui/`):
- `toolbar.ts` - Fixed toggle button (z-index: 999999)
- `comment-box.ts` - Modal with viewport-aware positioning, keyboard shortcuts (Esc, Ctrl+Enter)

**Utilities** (`src/utils/`):
- `selectors.ts` - Smart CSS selector generation (ID > data-testid > path-based), filters Tailwind/Bootstrap utility classes
- `dom.ts` - Element creation helpers
- `viewport.ts` - Window/scroll/devicePixelRatio detection

**Public API** (exposed as global `Orphy`):
```typescript
Orphy.init({ projectId, apiUrl, locale, onSubmit, onError })
Orphy.toggle()
Orphy.isActive()
Orphy.getFeedbacks()
Orphy.destroy()
```

**Z-index hierarchy**: 999999 (toolbar/comment-box) > 999998 (overlay) > 999997 (highlight)

## Key Design Decisions

- **No framework in widget** - Minimal bundle, maximum compatibility
- **IIFE format** - Direct `<script>` injection, no bundler required on host site
- **Overlay-only approach** - Never modifies the underlying website DOM
- **Best-effort selectors** - Graceful degradation when unique selectors unavailable
- **CSS-in-JS** - Styles encapsulated without shadow DOM

## TypeScript Configuration

Both projects use strict TypeScript. Widget has extra strict flags:
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitReturns`

## Tech Stack

### Widget
- Vanilla TypeScript
- Vite (IIFE bundle)
- No runtime dependencies

### Admin (planned)
- Next.js 15
- Convex (database + realtime)
- Clerk (authentication)
- shadcn/ui + Tailwind v4
- Vercel (hosting)
