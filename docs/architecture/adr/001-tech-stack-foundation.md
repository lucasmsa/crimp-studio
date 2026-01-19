# ADR-001: Tech Stack Foundation

## Status
Accepted

## Context

Choosing a tech stack for Crimp Studio that:
1. Supports learning goals (Three.js, AI/ML, procedural generation)
2. Enables "techy yet artisanal" UX
3. Stays within free/low-cost infrastructure
4. Works well for solo developer
5. Allows future growth

## Decision

### Frontend (apps/web)
- **Vite + React 18 + TypeScript**: Fast DX, strong typing
- **React Three Fiber + drei**: Three.js as React components
- **Tailwind CSS**: Utility-first, rapid iteration
- **Zustand**: Lightweight state management
- **Konva.js**: 2D canvas for wall editor

### Backend (apps/api) - Phase 2
- **FastAPI (Python)**: Async, great for ML
- **YOLOv8 + Ultralytics**: Object detection

### Database & Storage
- **Supabase**: PostgreSQL + Auth + Storage, generous free tier

### Infrastructure
- **Vercel**: Frontend hosting
- **Railway/Render**: API hosting (when needed)
- **pnpm workspaces**: Monorepo management

### Typography
- **Headings**: Space Grotesk
- **Body**: Satoshi
- **Mono**: JetBrains Mono

### Why NOT Next.js?
- Most processing is client-side
- Don't need SSR for a tool/app
- Simpler mental model
- Can add API separately

### Why monorepo?
- Shared types between frontend and algorithms
- Easier atomic changes
- Simpler local development
- Solo developer

## Consequences

### Positive
- Fast iteration with Vite
- Learn Three.js with familiar React patterns
- Shared types reduce duplication
- Free hosting for MVP

### Negative
- Need separate API setup
- pnpm workspaces learning curve
- May need Next.js if SEO becomes critical

### Risks
- R3F abstraction (mitigated: can use raw Three.js)
- Supabase lock-in (mitigated: standard PostgreSQL)
