import { useId } from 'react'
import '../../styles/login-motion.css'

const INFINITY_PATH =
  'M60 30C60 30 48 8 30 8C14 8 6 20 6 30C6 40 14 52 30 52C48 52 60 30 60 30' +
  'C60 30 72 8 90 8C106 8 114 20 114 30C114 40 106 52 90 52C72 52 60 30 60 30Z'

const LOOP_SECONDS = 4
const DOT_START_SECONDS = 1.6

interface AnimatedInfinityProps {
  size?: number
  animate?: boolean
  className?: string
}

export function AnimatedInfinity({
  size = 120,
  animate = true,
  className = '',
}: AnimatedInfinityProps) {
  const uid = useId().replace(/:/g, '')
  const gradientId = `inf-grad-${uid}`
  const haloId = `inf-halo-${uid}`
  const classes = ['inf-mark', animate ? 'inf-mark--animated' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={classes}
      width={size}
      height={size / 2}
      viewBox="0 0 120 60"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="120"
          y2="0"
        >
          <stop offset="0" stopColor="#FF8A00" />
          <stop offset="0.5" stopColor="#FFC27A" />
          <stop offset="1" stopColor="#FF8A00" />
        </linearGradient>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="#FFB347" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFB347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="inf-mark__track" d={INFINITY_PATH} pathLength={100} />
      <path
        className="inf-mark__draw"
        d={INFINITY_PATH}
        pathLength={100}
        stroke={`url(#${gradientId})`}
      />
      {animate ? (
        <g className="inf-mark__dot" opacity="0">
          <circle r="8" fill={`url(#${haloId})`} />
          <circle r="3" fill="#FFF1DC" />
          <set attributeName="opacity" to="1" begin={`${DOT_START_SECONDS}s`} fill="freeze" />
          <animateMotion
            path={INFINITY_PATH}
            dur={`${LOOP_SECONDS}s`}
            begin={`${DOT_START_SECONDS}s`}
            repeatCount="indefinite"
          />
        </g>
      ) : null}
    </svg>
  )
}
