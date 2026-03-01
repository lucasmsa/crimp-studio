## ADDED Requirements

### Requirement: Unit tests for wall store
The wall store SHALL have unit tests covering hold CRUD, wall color changes, hold type selection, and clear holds.

#### Scenario: Test add hold
- **WHEN** `addHold(150, 200)` is called with selected type `jug`
- **THEN** the store contains one hold at position (150, 200) with type `jug`

#### Scenario: Test remove hold
- **WHEN** a hold exists and `removeHold(id)` is called
- **THEN** the hold is no longer in the store

#### Scenario: Test update hold position
- **WHEN** `updateHold(id, { x: 100, y: 300 })` is called
- **THEN** the hold's position is updated in the store

#### Scenario: Test update hold rotation
- **WHEN** `updateHold(id, { rotation: 45 })` is called
- **THEN** the hold's rotation is updated to 45

#### Scenario: Test clear all holds
- **WHEN** multiple holds exist and `clearHolds()` is called
- **THEN** the holds array is empty

#### Scenario: Test select hold
- **WHEN** `selectHold(id)` is called
- **THEN** `selectedHoldId` equals the given id

#### Scenario: Test wall color update
- **WHEN** `setWallColor('#FF5722')` is called
- **THEN** the wall's `wallColor` is `#FF5722`

### Requirement: Unit tests for hold geometry
Each hold geometry factory function SHALL be tested to verify it produces valid Three.js geometry with vertices.

#### Scenario: Test each hold type generates geometry
- **WHEN** the geometry factory is called for each hold type (jug, crimp, sloper, pinch, pocket, volume)
- **THEN** each returns a `BufferGeometry` with a non-empty position attribute

#### Scenario: Test perturbation modifies vertices
- **WHEN** geometry is generated with perturbation enabled
- **THEN** the vertex positions differ from the base geometry

### Requirement: E2E test for hold placement workflow
An E2E test SHALL verify the full workflow: open editor, click wall to place hold, verify hold appears.

#### Scenario: Place hold via click
- **WHEN** the editor page is loaded and the user clicks on the wall surface
- **THEN** a hold appears on the wall at the clicked position

### Requirement: E2E test for hold deletion workflow
An E2E test SHALL verify: select hold, delete it, verify it disappears.

#### Scenario: Delete hold via keyboard
- **WHEN** a hold is placed, clicked to select, then Delete key is pressed
- **THEN** the hold is removed from the wall

### Requirement: E2E test for hold selection visual feedback
An E2E test SHALL verify that selecting a hold produces visible feedback.

#### Scenario: Selected hold has visual feedback
- **WHEN** a hold is placed and clicked
- **THEN** the hold shows a selection state (glow/scale change visible in the rendered output)

### Requirement: E2E test for keyboard shortcuts
An E2E test SHALL verify that keyboard shortcuts work correctly.

#### Scenario: R key rotates selected hold
- **WHEN** a hold is selected and R is pressed
- **THEN** the hold rotation value changes in the store

#### Scenario: Arrow keys nudge selected hold
- **WHEN** a hold is selected and an arrow key is pressed
- **THEN** the hold position shifts by the nudge increment
