import { Stage, Layer, Rect } from 'react-konva'
import { colors } from '@/lib/colors'
import { useWallCanvas } from './hooks/useWallCanvas'
import { HoldShape } from './components/HoldShape'
import { HoldActions } from './components/HoldActions'
import { CANVAS_ELEMENTS, CANVAS_CONFIG } from './constants/canvas'

export function WallCanvas() {
  const {
    containerRef,
    canvasSize,
    wall,
    selectedHoldId,
    scale,
    offsetX,
    offsetY,
    wallToCanvas,
    getDragBounds,
    handleStageClick,
    handleHoldClick,
    handleHoldDragEnd,
    handleRotateHold,
    handleDeleteHold,
  } = useWallCanvas()

  const selectedHold = wall.holds.find((h) => h.id === selectedHoldId)
  const selectedPos = selectedHold ? wallToCanvas(selectedHold.x, selectedHold.y) : null

  // Perspective tilt based on wall angle (0° = flat, 90° = roof)
  const perspectiveRotation = (wall.angle / 90) * CANVAS_CONFIG.MAX_PERSPECTIVE_ROTATION

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-card rounded-lg border border-border overflow-hidden">
      <div
        className="w-full h-full"
        style={{ perspective: '1000px', perspectiveOrigin: 'center center' }}
      >
        <div
          style={{
            transform: `rotateX(${perspectiveRotation}deg)`,
            transformOrigin: 'center bottom',
            width: '100%',
            height: '100%',
          }}
        >
          <Stage
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleStageClick}
          >
        <Layer>
          {/* Wall background with sand color */}
          <Rect
            name={CANVAS_ELEMENTS.WALL_BACKGROUND}
            x={offsetX}
            y={offsetY}
            width={wall.width * scale}
            height={wall.height * scale}
            fill={colors.primary}
            opacity={0.15}
            stroke={colors.dark.border}
            strokeWidth={2}
          />

          {/* Holds */}
          {wall.holds.map((hold) => {
            const pos = wallToCanvas(hold.x, hold.y)
            const isSelected = hold.id === selectedHoldId

            return (
              <HoldShape
                key={hold.id}
                hold={hold}
                x={pos.x}
                y={pos.y}
                scale={scale}
                isSelected={isSelected}
                onClick={(e) => handleHoldClick(hold.id, e)}
                onDragEnd={(e) => handleHoldDragEnd(hold.id, e)}
                dragBoundFunc={getDragBounds}
              />
            )
          })}
          </Layer>
        </Stage>
        </div>
      </div>

      {/* Actions toolbar for selected hold */}
      {selectedHold && selectedPos && (
        <HoldActions
          x={selectedPos.x}
          y={selectedPos.y - 40}
          onRotate={() => handleRotateHold(selectedHold.id)}
          onDelete={() => handleDeleteHold(selectedHold.id)}
        />
      )}
    </div>
  )
}
