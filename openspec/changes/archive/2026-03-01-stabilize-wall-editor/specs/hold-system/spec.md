## ADDED Requirements

### Requirement: Six hold types with distinct solid 3D geometries
The system SHALL support 6 hold types: jug, crimp, sloper, pinch, pocket, volume. Each type SHALL have a visually distinct, solid (not hollow/shell) procedural 3D geometry. All geometries SHALL use `IcosahedronGeometry` or `ExtrudeGeometry` as the base — no thin shells, no hollow shapes.

#### Scenario: Jug is a solid extruded block with a lip
- **WHEN** a jug hold is placed
- **THEN** it renders as a thick extruded shape with a pronounced top lip (for gripping), using `ExtrudeGeometry` with bevel

#### Scenario: Crimp is a flat wide solid rock
- **WHEN** a crimp hold is placed
- **THEN** it renders as a wide, flat solid using `IcosahedronGeometry` scaled (1.5, 0.2, 0.4) — thin edge, gripped with fingertips

#### Scenario: Sloper is a solid squashed dome
- **WHEN** a sloper hold is placed
- **THEN** it renders as a wide, rounded solid using `IcosahedronGeometry` scaled (1.5, 1.5, 0.6) — no hollow backside, solid against the wall

#### Scenario: Pinch is a tall narrow solid rock
- **WHEN** a pinch hold is placed
- **THEN** it renders as a tall, narrow solid using `IcosahedronGeometry` scaled (0.5, 1.8, 0.8) — vertical orientation for side-grip

#### Scenario: Pocket is a solid block with a geometric hole
- **WHEN** a pocket hold is placed
- **THEN** it renders as a solid extruded block with a circular hole cut into it using `ExtrudeGeometry` with a `Shape.holes` path — clearly visible finger hole

#### Scenario: Volume is a large sharp geometric shape
- **WHEN** a volume hold is placed
- **THEN** it renders as a large `IcosahedronGeometry` (detail=0) for sharp flat panels, scaled (1.5, 1.5, 0.5) — flattened against the wall

### Requirement: All holds are visually solid and volumetric
No hold SHALL appear as a thin shell, hollow crescent, or invisible dot. Every hold SHALL have visible depth/thickness when viewed from any angle within the orbit constraints.

#### Scenario: Holds have visible depth from all angles
- **WHEN** the user orbits the camera to any allowed angle
- **THEN** every hold type appears solid and three-dimensional, never as a flat 2D shape

### Requirement: Hold material looks like climbing hold rock
All holds SHALL use `MeshStandardMaterial` with `roughness: 0.9`, `metalness: 0.1`, and `flatShading: true` for a matte, low-poly rock aesthetic.

#### Scenario: Holds have matte rock appearance
- **WHEN** holds are rendered on the wall
- **THEN** they have a matte, slightly rough surface with flat-shaded polygonal faces

### Requirement: Holds have type-specific default colors
Each hold type SHALL have a default color defined in `colors.ts`.

#### Scenario: Holds render with correct type color
- **WHEN** a jug hold is placed
- **THEN** it renders in the jug color (green)

### Requirement: Hold color is customizable per hold
Each hold SHALL have an optional `color` field in the store. When set, the hold SHALL render with the custom color instead of the type default.

#### Scenario: Custom color overrides type default
- **WHEN** a hold has a custom color set
- **THEN** the hold renders in the custom color, not the type color

#### Scenario: Hold without custom color uses type default
- **WHEN** a hold has no custom color set
- **THEN** the hold renders in the default type color

### Requirement: Hold type selector in sidebar
The sidebar SHALL show all 6 hold types as selectable options. The selected type SHALL be used for the next hold placement.

#### Scenario: User selects hold type
- **WHEN** the user clicks "Crimp" in the hold type selector
- **THEN** the selected hold type changes to crimp and the next click on the wall places a crimp

### Requirement: Holds cast shadows onto the wall
All hold meshes SHALL have `castShadow = true`. The wall mesh SHALL have `receiveShadow = true`. Holds SHALL cast visible shadows onto the wall surface.

#### Scenario: Hold shadow visible on wall
- **WHEN** a hold is placed on the wall with directional lighting
- **THEN** a shadow from the hold is visible on the wall surface behind/below it
