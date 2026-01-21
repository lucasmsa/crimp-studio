import { Rect, Ellipse, Ring, RegularPolygon, Group } from 'react-konva'
import type { Hold } from '@/stores/wallStore'
import { holdColors } from '../constants/colors'
import { holdShapeConfigs } from '../config/holdShapes'
import { getHoldStyle } from '../config/holdStyles'
import { CANVAS_CONFIG } from '../constants/canvas'

interface HoldShapeProps {
  hold: Hold
  x: number
  y: number
  scale: number
  isSelected: boolean
  onClick: (e: any) => void
  onDragEnd: (e: any) => void
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number }
}

export function HoldShape({
  hold,
  x,
  y,
  scale,
  isSelected,
  onClick,
  onDragEnd,
  dragBoundFunc,
}: HoldShapeProps) {
  const config = holdShapeConfigs[hold.type]
  const style = getHoldStyle(isSelected)
  const color = holdColors[hold.type]

  const baseSize = Math.max(hold.size * scale, CANVAS_CONFIG.MIN_HOLD_RADIUS)
  const width = baseSize * config.widthMultiplier
  const height = baseSize * config.heightMultiplier

  const commonProps = {
    fill: color,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    shadowColor: style.shadowColor,
    shadowBlur: style.shadowBlur,
    rotation: hold.rotation || 0,
  }

  const renderShape = () => {
    switch (config.shape) {
      case 'roundedRect':
        return (
          <Rect
            offsetX={width / 2}
            offsetY={height / 2}
            width={width}
            height={height}
            cornerRadius={config.cornerRadius}
            {...commonProps}
          />
        )

      case 'rect':
        return (
          <Rect
            offsetX={width / 2}
            offsetY={height / 2}
            width={width}
            height={height}
            cornerRadius={config.cornerRadius}
            {...commonProps}
          />
        )

      case 'ellipse':
        return (
          <Ellipse
            radiusX={width / 2}
            radiusY={height / 2}
            {...commonProps}
          />
        )

      case 'ring':
        return (
          <Ring
            innerRadius={baseSize * (config.innerRadius || 0.4)}
            outerRadius={baseSize}
            {...commonProps}
          />
        )

      case 'polygon':
        return (
          <RegularPolygon
            sides={config.sides || 5}
            radius={baseSize}
            {...commonProps}
          />
        )

      default:
        return null
    }
  }

  return (
    <Group
      x={x}
      y={y}
      draggable
      dragBoundFunc={dragBoundFunc}
      onClick={onClick}
      onDragEnd={onDragEnd}
    >
      {renderShape()}
    </Group>
  )
}
