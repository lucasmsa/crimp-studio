# ADR-003: 3D Wall Migration Checkpoint

## Status
In Progress

## Context
Migrated the wall editor from 2D Konva.js to 3D React Three Fiber. The migration delivered a working 3D canvas but with significant bugs and a conceptual mismatch in the wall model. This was a vibe-coding session — lots of code shipped fast with no specs or tests.

## What Was Done
- Replaced Konva.js with R3F Canvas
- Created procedural 3D hold geometries (jug, crimp, sloper, pinch, pocket, volume)
- Multi-panel wall store with panel CRUD
- Hold placement via raycasting
- Hold dragging (buggy)
- OrbitControls with constraints
- Hold actions overlay via drei `<Html>`
- Removed `konva` and `react-konva` dependencies
- Added i18n keys for panels in all 3 languages

## Known Issues

### Critical
1. **Wall model is wrong** — Separate floating panels instead of one continuous wall with subdivisions. Panels disconnect and overlap. Not how real bouldering gym walls work.
2. **Dragging is broken** — Hold dragging doesn't follow pointer. Raycasting calculates wrong positions.
3. **No tests** — Zero unit, integration, or E2E tests for ~15 new files.

### High
4. **Hold sizes are off** — Pocket and crimp are tiny/invisible. Volume is spiky (dodecahedron + perturbation = ugly).
5. **Actions toolbar invisible** — Same color as wall background, nearly transparent.
6. **Camera controls fight interactions** — OrbitControls and hold click/drag conflict.
7. **Width/height creates orphaned holds** — Resizing wall doesn't constrain/reposition holds.

### Medium
8. **No wall/hold color painting** — Can't customize wall or hold colors.
9. **No drag-to-resize** — Width/height via number inputs is clunky and error-prone.

## Decisions

### Adopt Spec-Driven Development
- Write feature specs BEFORE implementation
- Define testable success criteria
- Consider OpenSpec framework (openspec.dev)
- Validate each increment before moving on

### Simplify First, Subdivisions Last
The wall subdivision system (cutting the wall into angle sections) is the most complex feature. It should be done LAST, after the basics are solid:

**Priority order:**
1. Fix the wall as a single flat panel (one angle, one surface)
2. Fix hold geometries (proper sizes, good-looking shapes)
3. Fix interactions (placement, dragging, selection)
4. Fix visuals (toolbar visibility, hold/wall colors)
5. Add testing (store, hooks, E2E with Playwright MCP)
6. Wall subdivisions with angle bending
7. THEN genetic algorithm (needs the full wall with angles to generate meaningful routes)

### Drop Width/Height Inputs for Now
- Remove manual dimension inputs (too error-prone, causes floating holds)
- Fixed wall proportions initially
- Later: drag-to-resize borders (more natural interaction)
- Later: drag-to-resize holds too

### Install Playwright MCP for Testing
```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```
Enables the AI to test its own code in a real browser before shipping.

## Consequences
- Need to simplify and stabilize before adding complexity
- SDD approach = more upfront planning, less debugging
- Subdivision feature deferred to avoid premature complexity
- Testing becomes a first-class requirement, not an afterthought
