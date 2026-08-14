interface TapeCrossProps {
  /** Positioning + sizing classes from the parent composition */
  className?: string
}

/**
 * Climbing tape "X" — the mark setters tape under start holds.
 * Two crossed strips, slightly torn-looking via skew.
 */
export function TapeCross({ className = '' }: TapeCrossProps) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`} data-testid="tape-cross">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[18%] w-full rotate-45 skew-x-6 bg-primary/90" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[18%] w-full -rotate-45 -skew-x-3 bg-primary/90" />
      </div>
    </div>
  )
}
