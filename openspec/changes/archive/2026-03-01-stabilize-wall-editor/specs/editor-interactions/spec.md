## ADDED Requirements

### Requirement: Click wall to place hold
Clicking on the wall surface SHALL place a hold of the currently selected type at the clicked position. The hold position SHALL be stored in centimeters relative to the wall's bottom-left corner.

#### Scenario: Place hold on wall click
- **WHEN** the user clicks on the wall surface
- **THEN** a hold of the selected type appears at the clicked position on the wall

#### Scenario: Hold position is accurate
- **WHEN** the user clicks near the center of the wall
- **THEN** the hold appears at the center, not offset to a wrong location

#### Scenario: Click on empty wall with hold selected deselects
- **WHEN** a hold is selected and the user clicks on empty wall space
- **THEN** the hold is deselected and no new hold is placed

### Requirement: Hold placement has pop-in animation
When a hold is placed, it SHALL animate from scale 0 to its final scale using a spring animation. The animation SHALL feel snappy and satisfying.

#### Scenario: Hold pops into existence
- **WHEN** a hold is placed on the wall
- **THEN** the hold scales up from 0 with a spring-like overshoot animation

### Requirement: Click hold to select
Clicking on a hold SHALL select it. Only one hold can be selected at a time.

#### Scenario: Select a hold
- **WHEN** the user clicks on a hold
- **THEN** the hold becomes selected with a visible glow effect (bloom-enhanced) and slight scale increase

#### Scenario: Selecting a new hold deselects previous
- **WHEN** a hold is selected and the user clicks a different hold
- **THEN** the first hold is deselected and the second hold is selected

### Requirement: Selected hold shows actions overlay
A selected hold SHALL display a floating actions overlay with rotate and delete buttons.

#### Scenario: Actions overlay appears on selection
- **WHEN** a hold is selected
- **THEN** rotate and delete buttons appear above the hold

#### Scenario: Actions overlay is visible against any wall color
- **WHEN** the actions overlay is displayed
- **THEN** the buttons have sufficient contrast with a solid background/border to be clearly visible regardless of wall color

### Requirement: Rotate hold via button or keyboard
Clicking the rotate button or pressing R SHALL rotate the selected hold by 45 degrees clockwise.

#### Scenario: Rotate hold via button
- **WHEN** the user clicks the rotate button on a selected hold
- **THEN** the hold rotates 45 degrees clockwise visually and the rotation updates in the store

#### Scenario: Rotate hold via R key
- **WHEN** a hold is selected and the user presses R
- **THEN** the hold rotates 45 degrees clockwise

### Requirement: Delete hold via button or keyboard
Clicking the delete button or pressing Delete/Backspace SHALL remove the selected hold with a fade-out animation.

#### Scenario: Delete hold via button
- **WHEN** the user clicks the delete button on a selected hold
- **THEN** the hold fades/scales out and is removed from the wall and the store

#### Scenario: Delete hold via keyboard
- **WHEN** a hold is selected and the user presses Delete or Backspace
- **THEN** the hold fades/scales out and is removed from the wall and the store

### Requirement: Drag hold to reposition
Dragging a hold SHALL move it along the wall surface. The hold SHALL stay within wall bounds. Raycasting SHALL use an invisible reference plane aligned with the wall (not the wall mesh itself) for reliable tracking.

#### Scenario: Drag hold follows pointer
- **WHEN** the user drags a hold
- **THEN** the hold follows the pointer position projected onto the wall surface smoothly

#### Scenario: Hold clamped to wall bounds
- **WHEN** the user drags a hold past the wall edge
- **THEN** the hold stops at the wall boundary and does not go outside

#### Scenario: Orbit controls disabled during drag
- **WHEN** the user is dragging a hold
- **THEN** camera orbit controls are disabled so the camera does not move

#### Scenario: Orbit controls re-enabled after drag
- **WHEN** the user releases a dragged hold
- **THEN** camera orbit controls are re-enabled

### Requirement: Nudge hold with keyboard
WASD and Arrow keys SHALL nudge the selected hold by a small increment (5cm). Shift + key SHALL nudge by a larger increment (20cm).

#### Scenario: Arrow keys nudge hold
- **WHEN** a hold is selected and the user presses an arrow key
- **THEN** the hold moves 5cm in the corresponding direction (up/down/left/right)

#### Scenario: WASD nudges hold
- **WHEN** a hold is selected and the user presses W/A/S/D
- **THEN** the hold moves 5cm in the corresponding direction (W=up, A=left, S=down, D=right)

#### Scenario: Shift+key nudges hold by larger increment
- **WHEN** a hold is selected and the user presses Shift + an arrow key or WASD key
- **THEN** the hold moves 20cm in the corresponding direction

#### Scenario: Nudge is clamped to wall bounds
- **WHEN** a hold is near the wall edge and nudged toward it
- **THEN** the hold stops at the wall boundary

### Requirement: Orbit camera around wall
The user SHALL be able to orbit the camera around the wall by click-dragging empty space. Orbit SHALL be constrained to prevent disorienting views.

#### Scenario: Orbit within constraints
- **WHEN** the user drags to orbit the camera
- **THEN** the camera rotates within polar (30-120 degrees) and azimuth (+-45 degrees) limits

#### Scenario: Scroll to zoom
- **WHEN** the user scrolls the mouse wheel
- **THEN** the camera zooms in or out between 2m and 15m distance from the wall

### Requirement: Hold hover has animated feedback
Hovering over a hold SHALL show animated visual feedback using spring transitions.

#### Scenario: Hover scales up smoothly
- **WHEN** the user hovers over a hold
- **THEN** the hold smoothly scales up (spring animation) and the cursor changes to pointer

#### Scenario: Hover out scales down smoothly
- **WHEN** the user moves the pointer away from a hold
- **THEN** the hold smoothly returns to its default scale

### Requirement: Keyboard shortcuts summary
The editor SHALL support the following keyboard shortcuts for a design-tool-like workflow:

#### Scenario: R rotates selected hold
- **WHEN** a hold is selected and the user presses R
- **THEN** the hold rotates 45 degrees clockwise

#### Scenario: Backspace/Delete removes selected hold
- **WHEN** a hold is selected and the user presses Backspace or Delete
- **THEN** the selected hold is removed

#### Scenario: Escape deselects current hold
- **WHEN** a hold is selected and the user presses Escape
- **THEN** the hold is deselected

#### Scenario: WASD/Arrows move selected hold
- **WHEN** a hold is selected and the user presses W/A/S/D or Arrow keys
- **THEN** the hold nudges in the corresponding direction

### Requirement: Interactive elements show pointer cursor
All interactive elements (holds, buttons, controls) SHALL show a pointer cursor on hover.

#### Scenario: Hold shows pointer on hover
- **WHEN** the user hovers over a hold
- **THEN** the cursor changes to pointer

#### Scenario: Button shows pointer on hover
- **WHEN** the user hovers over any clickable button in the overlay or sidebar
- **THEN** the cursor changes to pointer
