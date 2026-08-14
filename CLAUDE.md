# Crimp Studio

Climbing wall designer and bouldering route generator.

## Project Context

**Vision**: "Techy yet artisanal" - a tool built by climbers, for climbers, with the technical sophistication of modern dev tools but the warmth of climbing culture.

**Goals**:
1. Learn Three.js/R3F, YOLOv8/ML, and procedural generation
2. Build a portfolio piece showcasing full-stack + 3D + AI
3. Create something to be proud of

## Tech Stack

### Frontend (apps/web)
- Vite + React 19 + TypeScript
- React Three Fiber + drei + postprocessing (3D)
- Tailwind CSS
- Zustand (state)

### Backend (apps/api) - Future
- FastAPI (Python)
- YOLOv8 + Ultralytics
- Supabase (database + auth + storage)

## Commands

```bash
# Install dependencies
pnpm install

# Run web app in dev mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run all validation (lint, typecheck, tests) - ALWAYS run after implementation
pnpm ci:flow
```

## Project Structure

```
crimp-studio/
├── apps/
│   ├── web/                    # React + R3F frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── three/      # 3D components (Hero, Wall3D, etc.)
│   │   │   │   ├── editor/     # Wall editor components
│   │   │   │   └── ui/         # Design system components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/            # Utilities
│   │   │   ├── i18n/           # Translation files
│   │   │   │   ├── en-us.json
│   │   │   │   ├── pt-br.json
│   │   │   │   └── es-mx.json
│   │   │   └── pages/          # Route pages
│   │   │       └── <Page>/
│   │   │           ├── index.tsx
│   │   │           ├── hooks/
│   │   │           ├── components/
│   │   │           ├── config/
│   │   │           ├── utils/
│   │   │           └── __tests__/
│   │   └── public/
│   │       └── models/         # 3D assets (.glb files)
│   └── api/                    # FastAPI backend (Phase 2)
├── packages/
│   ├── route-gen/              # Route generation algorithms
│   └── shared/                 # Shared types and constants
├── training/                   # ML training scripts
└── docs/
    ├── prd/                    # Product requirement docs
    ├── features/               # Feature specs & backlog
    ├── architecture/
    │   └── adr/                # Architecture Decision Records
    └── research/               # Market research, references
```

---

## Core Workflow

**Docs-driven development (see ADR-004). Every feature follows this flow:**

1. **Frame** - Pick the item from `docs/features/backlog.md`. For large surfaces, write or review a PRD in `docs/prd/` with success criteria first. Record significant decisions as ADRs in `docs/architecture/adr/`.
2. **Research** - Does the project already have a component/functionality that does what we want? Check existing patterns. For new tech, check latest docs.
3. **Plan** - Propose approach, verify alignment, order by impact. Break into small testable increments.
4. **Implement** - Build with tests and error handling, following conventions. Test each increment before moving on.
5. **Validate** - ALWAYS run `pnpm ci:flow` after implementation. Use Playwright MCP to verify interactions in a real browser when applicable.

**STRICT RULE: No large implementation without a PRD/ADR or at minimum defined success criteria.**

**STRICT RULE: When behavior changes, update the matching doc in `docs/features/` and check off or reword the backlog item in the same change. Never let the docs fall behind the code.**

---

## Translation (i18n)

**Supported languages:** `pt-br`, `en-us`, `es-mx`

**STRICT RULE: Never hardcode user-facing strings.**

```tsx
// BAD - hardcoded text
<button>Open Editor</button>
<h1>Welcome to Crimp Studio</h1>

// GOOD - use i18n
<button>{t('landing.cta.openEditor')}</button>
<h1>{t('landing.hero.title')}</h1>
```

**When creating new texts:**
- Add labels to ALL language files: `i18n/en-us.json`, `i18n/pt-br.json`, `i18n/es-mx.json`
- Use semantic keys: `editor.holdTypes.crimp`, `landing.hero.title`
- Group by feature/page: `landing.*`, `editor.*`, `about.*`

---

## Problem Solving

**When stuck:** Stop. The simplest solution is usually the best.

**When uncertain:** "Let me think carefully about this architecture."

**When choosing:** "I see approach A (simple) vs B (flexible). Which do you prefer?"

These redirects prevent over-engineering. When uncertain about implementation, stop and ask for guidance. Focus on maintainable solutions over clever abstractions.

---

## Architecture Principles

### Prefer explicit over implicit
- Clear function names over clever abstractions
- Obvious data flow over hidden magic
- Direct dependencies over service locators

### Abstractions are costly, use wisely
- Follow the **rule of three** before creating an abstraction
- Simple is better than complex
- If the app is getting too "smart", suggest moving business logic to the backend

### Avoid Ternary Extravaganza
When a component has multiple conditional variations:
- Extract logic into configuration objects
- Create config file: `pages/<Page>/config/<pageName>Config.ts`
- Use `getConfig({ condition })` that returns structured data

```tsx
// Bad: ternaries everywhere
{isAdvanced ? <A /> : <B />}
{isAdvanced ? titleA : titleB}

// Good: configuration object
const config = getEditorConfig({ isAdvanced })
<Component {...config} />
```

### Components are presentational ONLY — always modularize
- **Hooks** (`hooks/`): All state interactions, side effects, event handlers, keyboard listeners
- **Utils** (`utils/`): Pure functions, calculations, transformations
- **Config** (`config/`): Configuration objects, constants that drive conditional rendering
- **Components**: Call hooks, spread configs, render JSX. Nothing more.
- Avoid prop drilling — use hooks to access shared state directly where it makes sense
- If a component file is growing beyond rendering, stop and extract to hooks/utils

### Keep functions small and focused
- If you need comments to explain sections, split into functions
- Don't add unnecessary comments, but add them when you see fit
- Prefer many small files over few large ones

---

## Error Handling

**Patterns:**
- Custom domain exceptions in `lib/errors/`
- Form validation with clear user feedback
- Consistent JSON API responses
- Handle exceptions for _exceptional_ cases only
- Only catch errors that are actionable by the user

**Don't:**
- Don't implement catch-all clauses
- Don't swallow errors silently

**CSS over JS:**
- What you can do with CSS/Tailwind, use instead of adding extra TypeScript logic for styles

---

## Testing Requirements

**STRICT RULE: Code without tests is not done. Every feature, hook, store action, and utility must be tested before moving on.**

### Test Structure
- Follow **Arrange → Act → Assert** structure
- Do NOT write redundant comments like "Arrange", "Act", "Assert"
- That division should be clear in code with visual spacing

### What to Test
- **Unit tests**: Stores, hooks, pure functions, algorithms (especially `route-gen`)
- **Component tests**: UI components with variants and interactions
- **Integration tests**: Larger flows, API calls
- **E2E tests**: Full user flows via Playwright MCP (hold placement, dragging, deletion, panel config)

### When to Test
- **Stores**: After writing or modifying any Zustand store action
- **Hooks**: After writing or modifying any custom hook with logic
- **Utilities**: After writing any pure function (geometry, layout, math)
- **Interactions**: After implementing any user-facing behavior (use Playwright MCP)
- **Never**: Ship a batch of 10+ files without tests. Test incrementally.

### Mocking Strategy
**Push mocks as far to the border as possible:**
- Mock only external dependencies and services
- Let business logic run naturally
- This ensures tests hit implementation as much as possible

**External dependencies to mock:**
- Supabase client
- Browser APIs (localStorage, canvas, etc.)
- 3D context (WebGL)

### E2E with Playwright MCP
- Use `microsoft/playwright-mcp` for browser-based testing
- Run dev server, then test interactions through real browser
- Verify visual states, click targets, drag behavior
- Catch regressions before the user sees them

### Accessibility
- Test with accessibility in mind
- Ensure proper ARIA attributes
- Test keyboard navigation

---

## Architecture Decision Records (ADRs)

**Document significant decisions in `/docs/architecture/adr/`**

**When to create an ADR:**
- Important technology choices (frameworks, libraries)
- Significant architectural patterns
- API design approaches
- Security implementation choices
- Checkpoints for your work

**Format:** Numbered files like `001-adopt-vite-react.md`

**Template:**
```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this change?
```

---

## Component Creation Checklist

**For reusable components in `components/ui/`:**
- [ ] Create component file with TypeScript types
- [ ] Add `data-testid` attributes for testing
- [ ] Create `__tests__/` folder with component tests
- [ ] Test rendering, props, user interactions, and accessibility
- [ ] Document props with JSDoc comments

**Page Structure:**
- Extract business logic to custom hooks in `pages/<Page>/hooks/`
- Create child components in `pages/<Page>/components/`
- Page-specific utilities go in `pages/<Page>/utils/`
- Page configuration objects go in `pages/<Page>/config/`
- Reusable UI components go in root `components/ui/` with tests
- Tests for pages go in `pages/<Page>/__tests__/`

---

## Design Tokens

### Colors

**Dark Mode (Default)**
| Role | Hex | Name |
|------|-----|------|
| Background | `#1B3C53` | deep-water |
| Surface | `#234C6A` | steel |
| Border | `#456882` | slate |
| Text Primary | `#FAFAFA` | chalk-white |
| Text Secondary | `#A8BCCB` | mist-blue |
| Primary | `#D2C1B6` + ink text | chalk-beige |

**Light Mode**
| Role | Hex | Name |
|------|-----|------|
| Background | `#F2EDE7` | paper |
| Surface | `#FFFFFF` | cloud |
| Border | `#D2C1B6` | chalk-beige |
| Text Primary | `#171717` | graphite |
| Text Secondary | `#5C6B78` | stone-blue |
| Primary | `#1B3C53` + white text | deep-water |

**Accent Colors (Both Modes)**
| Role | Hex | Name |
|------|-----|------|
| Accent | `#456882` + white text | slate |
| Success | `#22C55E` | send-green |
| Error | `#EF4444` | fall-red |

**Contrast rules (ADR-005 amended, WCAG AA, ratios computed not eyeballed):**
- Primary flips per theme: chalk-beige fill + ink text on dark (11.35:1), deep-water fill + white text on light (11.07:1).
- Success and error fills take ink foregrounds, not white (white on send-green is 2.28:1).
- Muted text: `#A8BCCB` on deep-water (5.90:1), `#5C6B78` on paper (4.71:1).

### Typography
- **Poster/Stamps:** Anton (condensed, uppercase, hard offset shadows)
- **Headings:** Clash Display (confident, characterful, mixed case)
- **Body:** Satoshi (warm, approachable)
- **Mono/Data:** JetBrains Mono (grades, angles, coordinates)

---

## Tailwind & Styling Rules

**STRICT RULE: Always use semantic Tailwind classes. Never hardcode colors.**

```tsx
// BAD - hardcoded hex values or CSS variables directly
<div className="bg-[#0A0A0A]">
<div className="bg-(--bg)">
<div style={{ backgroundColor: '#FF5722' }}>

// GOOD - semantic Tailwind classes
<div className="bg-background">
<div className="bg-surface">
<div className="bg-primary">
<div className="text-foreground">
<div className="text-muted">
<div className="border-border">
```

**Available semantic classes:**
| Class | Usage |
|-------|-------|
| `bg-background` | Main page background |
| `bg-surface` | Cards, panels, elevated surfaces |
| `bg-primary` | Primary actions, CTAs |
| `bg-secondary` | Secondary highlights |
| `bg-success` | Success states |
| `bg-error` | Error states |
| `text-foreground` | Primary text |
| `text-muted` | Secondary/muted text |
| `border-border` | Default borders |

**Typography classes:**
| Class | Font |
|-------|------|
| `font-poster` | Anton (posters, stamps, HUD) |
| `font-heading` | Clash Display (headings) |
| `font-body` | Satoshi (body text) |
| `font-mono` | JetBrains Mono (data, grades) |

**For JavaScript/TypeScript contexts (Three.js, inline styles):**

Use `lib/colors.ts` instead of hardcoding hex values:

```tsx
import { colors } from '@/lib/colors'

// BAD - hardcoded in JS
<spotLight color="#FFDAB3" />
style={{ backgroundColor: '#FFDAB3' }}

// GOOD - use colors.ts
<spotLight color={colors.primary} />
style={{ backgroundColor: colors.primary }}
```

---

## Comments Philosophy

**This is a learning project.** Use comments pragmatically to:
- Document the "why" behind non-obvious decisions
- Explain lighting setups, 3D concepts, and algorithm logic
- Leave breadcrumbs for future learning

```tsx
// BAD - states the obvious
// Set intensity to 0.5
<ambientLight intensity={0.5} />

// GOOD - explains the purpose
{/* Base ambient - subtle fill to prevent pure black shadows */}
<ambientLight intensity={0.3} />

{/* Key light - warm, primary illumination from top-right */}
<spotLight position={[5, 5, 5]} color={colors.primary} />

{/* Rim light - creates edge definition, separates subject from background */}
<pointLight position={[0, -3, -5]} color={colors.primary} />
```

**When to comment:**
- Three.js lighting setups (explain the lighting rig)
- Algorithm steps (explain the approach)
- Non-obvious CSS/Tailwind combinations
- Workarounds or browser-specific fixes
- Learning notes for future reference

**When NOT to comment:**
- Self-explanatory code
- Type definitions that speak for themselves
- Obvious function names

---

## Conventions

- **Styling**: Tailwind CSS with semantic design tokens (see above)
- **Components**: Functional components with TypeScript
- **State**: Zustand stores in `stores/`
- **3D Components**: Located in `components/three/`
- **Types**: Shared types in `packages/shared/src/types.ts`
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files

---

## Notes

- Always consult this CLAUDE.md file when working on the project
- When in doubt, ask for guidance
- Ship small, ship often
