## ADDED Requirements

### Requirement: Wall renders as a single flat surface
The wall SHALL render as a single `BoxGeometry` mesh with fixed dimensions of 300cm wide x 400cm tall x 5cm deep. The wall SHALL be vertical (0 degrees angle) and centered in the 3D scene.

#### Scenario: Wall renders on editor load
- **WHEN** the user navigates to the editor page
- **THEN** a single flat wall surface is visible in the 3D canvas with correct proportions (3:4 aspect ratio)

#### Scenario: Wall has visual thickness
- **WHEN** the wall is viewed from an angle via orbit controls
- **THEN** the wall has visible depth (5cm) giving it a solid panel appearance

### Requirement: Wall has no user-editable dimensions
The editor SHALL NOT expose width, height, or angle inputs to the user. Wall dimensions are fixed at 300cm x 400cm, angle at 0 degrees.

#### Scenario: Sidebar has no dimension controls
- **WHEN** the user views the editor sidebar
- **THEN** there are no width, height, or angle input fields

### Requirement: Wall color is customizable
The wall store SHALL have a `wallColor` property (default: surface color from `colors.ts`). The sidebar SHALL expose a color picker that updates the wall surface color.

#### Scenario: Default wall color
- **WHEN** the editor loads with a new wall
- **THEN** the wall surface uses the default wall color from the design tokens

#### Scenario: User changes wall color
- **WHEN** the user selects a new color from the wall color picker
- **THEN** the wall surface updates to the selected color immediately

### Requirement: Store uses flat wall model
The wall store SHALL use a flat structure: one `Wall` object with `id`, `name`, `width`, `height`, `angle`, `wallColor`, and `holds[]`. There SHALL be no `panels` array.

#### Scenario: Store initializes with correct defaults
- **WHEN** the store is created
- **THEN** the wall has `width: 300`, `height: 400`, `angle: 0`, and an empty `holds` array

#### Scenario: No panel CRUD actions exist
- **WHEN** inspecting the store API
- **THEN** there are no `addPanel`, `removePanel`, `updatePanel`, or `setActivePanel` actions

### Requirement: Wall has premium lighting and shadows
The wall scene SHALL use hard shadows with a directional key light casting onto the wall surface. The wall mesh SHALL receive shadows and holds SHALL cast shadows onto the wall.

#### Scenario: Holds cast shadows on the wall
- **WHEN** holds are placed on the wall
- **THEN** each hold casts a visible shadow onto the wall surface below/behind it

### Requirement: Scene uses post-processing for visual polish
The editor SHALL use post-processing effects: selective Bloom (for selected hold glow), Vignette (dark edges for mood). Effects SHALL be subtle and not distract from the editing workflow.

#### Scenario: Selected hold glows with bloom
- **WHEN** a hold is selected
- **THEN** the hold's emissive glow is enhanced by bloom post-processing, creating a soft halo effect

#### Scenario: Vignette darkens scene edges
- **WHEN** the editor is open
- **THEN** the edges of the viewport are subtly darkened, drawing focus to the center wall
