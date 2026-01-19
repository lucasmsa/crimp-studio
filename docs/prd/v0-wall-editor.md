# PRD: V0 - Crimp Studio MVP

## Overview

**Product**: Crimp Studio
**Version**: V0
**Domain**: crimp.studio (or crimpstudio.dev)

## Vision

A web-based tool for designing climbing walls and generating bouldering routes. "Techy yet artisanal" - built by climbers, for climbers.

## Problem

Climbers with spray walls or home walls lack good tools to:
- Get route suggestions without manual work
- Design wall layouts before building
- Visualize and plan their setups

Existing apps require manual route creation or expensive hardware.

## V0 Features

### 1. Landing Page
- Interactive 3D climbing shoe hero
- Clear value proposition
- CTA to editor
- Light/dark theme
- Responsive

### 2. About Page
- Project story and motivation
- How it works (the tech/algorithms behind it)
- Roadmap / what's coming
- Credits and links
- Maybe: blog-style "building in public" updates

### 3. Wall Editor

**Wall Configuration:**
- Dimensions (width x height)
- Inclination/angle (0° slab → 45° overhang → 90° roof)

**Two Modes:**

A) **Generate Mode** (primary)
- Set wall parameters
- Click "Generate Boulder"
- Algorithm creates complete boulder (holds + route + grade)
- View multiple generated options

B) **Manual Mode** (optional)
- Click to place holds
- Drag to reposition
- Hold types: jug, crimp, sloper, pinch, volume
- Delete holds
- Then generate route from placed holds

**Persistence:**
- Export wall/route as JSON
- Save to localStorage
- Load previous walls

### 4. Route Generation (Genetic Algorithm)

**Input:**
- Wall dimensions + inclination
- (Optional) manually placed holds
- Difficulty preference (V0-V10)

**Algorithm:**
- Population-based genetic algorithm
- Fitness function considers:
  - Reachability (human proportions)
  - Flow (natural movement sequence)
  - Difficulty consistency (no random crux)
  - Wall angle impact
  - Hold type variety

**Output:**
- Multiple route options (top N from population)
- Estimated grade for each
- Visualized on canvas

### 5. Infrastructure
- Deploy to Vercel
- Register domain
- Basic SEO meta tags
- Privacy-friendly analytics (Plausible or similar)

## Out of Scope (V0)

- AI hold detection from photos
- User accounts / auth
- Cloud storage / sharing
- Style preferences (crimpy, dynamic, etc.)
- User feedback loop for algorithm

## Success Criteria

- [ ] 3D hero runs 60fps on mid-range devices
- [ ] GA generates climbable routes consistently
- [ ] Multiple diverse route options per generation
- [ ] Grade estimates are roughly accurate
- [ ] Works on mobile (view, limited edit)
- [ ] Lighthouse score 90+

## Open Questions

- Domain: crimp.studio vs crimpstudio.dev?
- Analytics: Plausible vs PostHog vs simple?
- GA params: population size, generations, mutation rate?

## Notes

Side project - quality over speed. No deadline.
