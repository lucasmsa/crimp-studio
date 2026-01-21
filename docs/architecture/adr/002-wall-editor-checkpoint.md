# ADR-002: Wall Editor Implementation Checkpoint

## Status
In Progress

## Context
Building the V0 wall editor with Konva.js canvas. Current state has several issues that need addressing before continuing.

## Current Implementation

### What's Working
- Basic canvas with Konva.js
- Hold placement on click
- Hold types (jug, crimp, sloper, pinch, pocket, volume)
- Zustand store for wall state
- Hold selection with visual feedback
- Hold deletion
- i18n translations (en-us, pt-br, es-mx)

### Known Issues
1. **Perspective/3D visualization** - CSS perspective breaks click coordinates. Need proper 3D box drawing with Konva instead.
2. **Hold shapes** - Current shapes (rect, ellipse, polygon) are ugly. Simplify to circles with 3D-like styling (gradients, shadows).
3. **Drag outside wall** - Holds can be dragged outside wall bounds. Need constraints.
4. **Popup position** - Actions toolbar doesn't follow hold during drag.
5. **Input validation** - No limits on wall dimensions or angle (user entered 230°).
6. **No hold color** - Holds should have customizable colors with random default.
7. **No tests** - Need unit tests for store and integration tests for canvas.

## Decision

### Angle/Inclination Limits
- Min: -15° (slab)
- Max: 60° (steep overhang, not quite roof)
- Default: 15° (slight overhang, most common)

### Wall Dimension Limits
- Width: 100cm - 1000cm (1m - 10m)
- Height: 100cm - 500cm (1m - 5m)

### 3D Visualization Approach
Draw wall as 3D box using Konva shapes:
- Main face: rectangle (the climbing surface)
- Side panels: trapezoids showing depth based on angle
- Holds sit on main face
- No CSS perspective (causes coordinate issues)

### Hold Visualization
- Simple circles (not complex shapes per type)
- Color indicates type OR user-selected color
- 3D effect via radial gradient and shadow
- Size varies by hold type

## File Structure
```
pages/editor/
├── index.tsx                    # Editor page layout
├── components/
│   ├── WallCanvas/
│   │   ├── index.tsx            # Canvas component
│   │   ├── hooks/
│   │   │   └── useWallCanvas.ts # Canvas logic
│   │   ├── components/
│   │   │   ├── Wall3D.tsx       # 3D wall shape
│   │   │   ├── Hold.tsx         # Single hold
│   │   │   └── HoldActions.tsx  # Selection toolbar
│   │   ├── constants/
│   │   │   ├── canvas.ts        # Canvas config
│   │   │   └── colors.ts        # Hold colors
│   │   └── config/
│   │       └── holdStyles.ts    # Hold visual styles
│   └── WallConfig/
│       ├── index.tsx            # Settings panel
│       └── constants/
│           └── holdTypes.ts     # Hold type list
└── __tests__/
    ├── wallStore.test.ts        # Store tests
    └── WallCanvas.test.tsx      # Canvas tests
```

## Next Steps
1. Add input validation with min/max limits
2. Constrain hold drag to wall bounds
3. Implement 3D wall box visualization
4. Simplify holds to styled circles
5. Add hold color selector
6. Fix popup to follow drag
7. Add tests

## Consequences
- Simpler hold shapes = less visual distinction between types (rely on color/size)
- 3D box drawing = more complex canvas code but better UX
- Input limits = prevents nonsense values
