const TEXT_RING =
  'LATE • NIGHT • HEIST • LATE • NIGHT • HEIST • LATE • NIGHT • HEIST • '

const ICONS = ['🎲', '🧙', '💻', '🎰', '🔐', '⚡']

const VIEW = 600
const CENTER = VIEW / 2
const TEXT_RADIUS = 275
const ICON_RADIUS = 240
const CIRCUMFERENCE = 2 * Math.PI * TEXT_RADIUS

type HeroOrbitProps = {
  children: React.ReactNode
}

export function HeroOrbit({ children }: HeroOrbitProps) {
  return (
    <div className="hero-orbit-wrap">
      <svg
        className="hero-orbit-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        aria-hidden="true"
      >
        <defs>
          <path
            id="heroTextPath"
            d={`M ${CENTER},${CENTER}
                m -${TEXT_RADIUS},0
                a ${TEXT_RADIUS},${TEXT_RADIUS} 0 1,1 ${TEXT_RADIUS * 2},0
                a ${TEXT_RADIUS},${TEXT_RADIUS} 0 1,1 -${TEXT_RADIUS * 2},0`}
          />
          <linearGradient id="heroTextGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F5D4" />
            <stop offset="50%" stopColor="#FF2E63" />
            <stop offset="100%" stopColor="#FFB703" />
          </linearGradient>
        </defs>

        {/* Rotating text ring */}
        <g className="hero-orbit-text-group">
          <text className="hero-orbit-text" fill="url(#heroTextGradient)">
            <textPath
              href="#heroTextPath"
              startOffset="0%"
              textLength={CIRCUMFERENCE}
              lengthAdjust="spacing"
            >
              {TEXT_RING}
            </textPath>
          </text>
        </g>

        {/* Counter-rotating icon ring */}
        <g className="hero-orbit-icon-group">
          {ICONS.map((icon, i) => {
            const angle = (360 / ICONS.length) * i
            return (
              <g key={icon} transform={`rotate(${angle} ${CENTER} ${CENTER})`}>
                <text
                  x={CENTER}
                  y={CENTER - ICON_RADIUS}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="hero-orbit-icon"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  {icon}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Everything in the middle — title, tagline, buttons */}
      <div className="hero-orbit-center">{children}</div>
    </div>
  )
}