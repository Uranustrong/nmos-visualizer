import type { CSSProperties } from 'react'

import type { MosfetState } from '../model/mosfetModel'

interface NMOSCrossSectionProps {
  state: MosfetState
}

const HOLES = [
  [46, 304], [93, 341], [142, 292], [188, 360], [237, 321], [287, 366],
  [337, 309], [388, 351], [439, 297], [488, 368], [538, 323], [586, 354],
  [633, 295], [677, 342], [72, 379], [162, 398], [267, 398], [368, 389],
  [474, 405], [574, 394], [659, 386],
] as const

const MAX_OVERDRIVE = 2.8
const CHANNEL_START_X = 210
const CHANNEL_LENGTH = 300
const SURFACE_Y = 190

const createChannelPath = (state: MosfetState) => {
  if (state.channelProfile.length === 0) return ''

  const top = state.channelProfile
    .map((point) => `${CHANNEL_START_X + point.x * CHANNEL_LENGTH},${SURFACE_Y}`)
    .join(' L ')
  const bottom = [...state.channelProfile]
    .reverse()
    .map((point) => {
      const thickness = 3 + 18 * (point.charge / MAX_OVERDRIVE)
      return `${CHANNEL_START_X + point.x * CHANNEL_LENGTH},${SURFACE_Y + thickness}`
    })
    .join(' L ')

  return `M ${top} L ${bottom} Z`
}

export function NMOSCrossSection({ state }: NMOSCrossSectionProps) {
  const { inputs, region, isWeakInversion, channelEnd, normalizedId } = state
  const depletionProgress = Math.min(inputs.vgs / inputs.vt, 1)
  const depletionDepth = 28 + depletionProgress * 58
  const channelPath = createChannelPath(state)
  const pinchX = CHANNEL_START_X + channelEnd * CHANNEL_LENGTH
  const electronCount = Math.max(
    7,
    Math.round(8 + Math.min(state.overdrive / MAX_OVERDRIVE, 1) * 16),
  )

  return (
    <figure className="diagram cross-section">
      <figcaption className="panel-heading">
        <span className="eyebrow">Device view</span>
        <span>NMOS cross-section</span>
      </figcaption>

      <svg
        className="cross-section__svg"
        viewBox="0 0 720 430"
        role="img"
        aria-labelledby="cross-section-title cross-section-description"
      >
        <title id="cross-section-title">Interactive NMOS cross-section</title>
        <desc id="cross-section-description">
          The gate voltage repels holes and forms an electron inversion channel.
          Drain voltage tapers that channel toward pinch-off.
        </desc>

        <defs>
          <pattern id="depletion-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M -2 2 L 2 -2 M 0 12 L 12 0 M 10 14 L 14 10" />
          </pattern>
          <filter id="electron-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="device-metal">
          <path d="M 120 126 V 78 H 82" />
          <path d="M 600 126 V 78 H 638" />
          <path d="M 360 60 V 28" />
          <circle cx="82" cy="78" r="4" />
          <circle cx="638" cy="78" r="4" />
          <circle cx="360" cy="28" r="4" />
        </g>

        <rect className="substrate" x="28" y="190" width="664" height="222" rx="4" />
        <path
          className="depletion-region"
          d={`M 188 190 H 532 V ${190 + depletionDepth} C 458 ${
            216 + depletionDepth
          }, 263 ${216 + depletionDepth}, 188 ${190 + depletionDepth} Z`}
        />

        <rect className="junction" x="70" y="126" width="140" height="100" rx="8" />
        <rect className="junction" x="510" y="126" width="140" height="100" rx="8" />
        <rect className="oxide" x="210" y="148" width="300" height="22" rx="2" />
        <rect className="gate" x="264" y="60" width="192" height="80" rx="4" />

        {region === 'saturation' && (
          <path
            className="pinch-wedge"
            d={`M ${pinchX} 190 L 510 190 L 510 258 Q ${pinchX + 30} 242 ${pinchX} 190 Z`}
          />
        )}

        {channelPath && (
          <path
            className="inversion-channel"
            data-testid="inversion-channel"
            data-channel-end={channelEnd}
            d={channelPath}
          />
        )}

        {isWeakInversion && (
          <g className="weak-inversion-electrons" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <circle
                key={index}
                cx={226 + index * 29}
                cy={188 + (index % 2) * 4}
                r="2.4"
              />
            ))}
          </g>
        )}

        {channelPath && (
          <g className="channel-electrons" aria-hidden="true" filter="url(#electron-glow)">
            {Array.from({ length: electronCount }, (_, index) => {
              const progress = (index + 0.5) / electronCount
              const x = CHANNEL_START_X + progress * channelEnd * CHANNEL_LENGTH
              const style = {
                '--electron-delay': `${-(index % 8) * 0.22}s`,
                '--electron-speed': `${Math.max(0.7, 2.4 - normalizedId * 0.35)}s`,
              } as CSSProperties

              return (
                <circle
                  key={index}
                  className={inputs.vds > 0 ? 'electron electron--moving' : 'electron electron--idle'}
                  cx={x}
                  cy={SURFACE_Y + 5 + (index % 3) * 3}
                  r="2.7"
                  style={style}
                />
              )
            })}
          </g>
        )}

        <g className="holes" aria-hidden="true">
          {HOLES.map(([x, y], index) => {
            const underGate = x > 185 && x < 535 && y < 340
            const opacity = underGate ? Math.max(0.06, 1 - depletionProgress * 1.15) : 0.68
            return (
              <g key={index} transform={`translate(${x} ${y})`} opacity={opacity}>
                <circle r="7" />
                <path d="M -3.5 0 H 3.5 M 0 -3.5 V 3.5" />
              </g>
            )
          })}
        </g>

        <g className="device-labels">
          <text x="120" y="62" textAnchor="middle">SOURCE</text>
          <text x="600" y="62" textAnchor="middle">DRAIN</text>
          <text x="360" y="48" textAnchor="middle">GATE</text>
          <text x="140" y="183" textAnchor="middle">n+</text>
          <text x="580" y="183" textAnchor="middle">n+</text>
          <text x="360" y="132" textAnchor="middle">metal</text>
          <text x="360" y="165" textAnchor="middle">oxide</text>
          <text x="360" y="388" textAnchor="middle">p-type substrate</text>
        </g>

        <g className="diagram-annotations">
          <path d={`M 370 ${245 + depletionProgress * 30} L 430 294`} />
          <text x="438" y="300">Depletion region</text>
          {channelPath && (
            <>
              <path d="M 286 209 L 246 238" />
              <text x="235" y="253">Inversion channel</text>
            </>
          )}
          {isWeakInversion && (
            <text x="360" y="236" textAnchor="middle">Qualitative weak inversion</text>
          )}
          {region === 'saturation' && (
            <>
              <path d={`M ${pinchX + 8} 204 L ${pinchX + 35} 238`} />
              <text x={pinchX + 41} y="253">Pinch-off region</text>
            </>
          )}
        </g>
      </svg>

      <div className="diagram-legend" aria-label="Carrier legend">
        <span><i className="legend-dot legend-dot--electron" />Electron</span>
        <span><i className="legend-dot legend-dot--hole">+</i>Hole</span>
        <span><i className="legend-swatch" />Depletion</span>
      </div>
    </figure>
  )
}
