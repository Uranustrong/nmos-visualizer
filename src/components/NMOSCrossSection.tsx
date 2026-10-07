import type { CSSProperties } from 'react'

import type { MosfetState } from '../model/mosfetModel'

interface NMOSCrossSectionProps {
  state: MosfetState
}

const HOLES = [
  [70, 346], [119, 393], [173, 352], [218, 421], [278, 371], [334, 429],
  [390, 384], [448, 421], [508, 358], [563, 415], [621, 365], [681, 424],
  [742, 350], [92, 438], [192, 378], [306, 337], [420, 446], [536, 452],
  [650, 458], [733, 397],
] as const

const SURFACE_Y = 230
const OXIDE_Y = 204
const OXIDE_HEIGHT = SURFACE_Y - OXIDE_Y
const CHANNEL_START_X = 250
const CHANNEL_LENGTH = 320
const MAX_OVERDRIVE = 2.8
const SOURCE = { left: 105, right: 250, bottom: 315 }
const DRAIN = { left: 570, right: 715, bottom: 315 }
const MAX_PINCH_REGION_LENGTH = 44
const PINCH_GROWTH_VOLTS = 0.45

const createChannelPath = (state: MosfetState, inversionEnd: number) => {
  if (state.channelProfile.length === 0) return ''

  const top = state.channelProfile
    .map(
      (point) =>
        `${CHANNEL_START_X + point.x * inversionEnd * CHANNEL_LENGTH},${SURFACE_Y}`,
    )
    .join(' L ')
  const bottom = [...state.channelProfile]
    .reverse()
    .map((point) => {
      const thickness = 3 + 18 * (point.charge / MAX_OVERDRIVE)
      return `${CHANNEL_START_X + point.x * inversionEnd * CHANNEL_LENGTH},${
        SURFACE_Y + thickness
      }`
    })
    .join(' L ')

  return `M ${top} L ${bottom} Z`
}

const junctionShape = ({ left, right, bottom }: typeof SOURCE) =>
  `M ${left} ${SURFACE_Y} H ${right} V ${bottom - 16} Q ${right} ${bottom} ${
    right - 16
  } ${bottom} H ${left + 16} Q ${left} ${bottom} ${left} ${bottom - 16} Z`

const pSideDepletionShape = (
  { left, right, bottom }: typeof SOURCE,
  extent: number,
) =>
  `M ${left - extent} ${SURFACE_Y} H ${right + extent} V ${bottom - 12} Q ${
    right + extent
  } ${bottom + extent} ${right - 12} ${bottom + extent} H ${left + 12} Q ${
    left - extent
  } ${bottom + extent} ${left - extent} ${bottom - 12} Z`

function GroundReference({ x, y }: { x: number; y: number }) {
  return (
    <g className="ground-reference" aria-label="Ground reference">
      <path d={`M ${x} ${y - 13} V ${y} M ${x - 13} ${y} H ${x + 13} M ${
        x - 9
      } ${y + 6} H ${x + 9} M ${x - 4} ${y + 12} H ${x + 4}`} />
    </g>
  )
}

export function NMOSCrossSection({ state }: NMOSCrossSectionProps) {
  const { inputs, region, isWeakInversion, channelEnd, normalizedId } = state
  const gateDepletionProgress = state.gateDepletionProgress
  const gateDepletionDepth = gateDepletionProgress * 60
  const gateDepletionEdgeRadius = Math.min(10, gateDepletionDepth / 2)
  const sourceDepletionExtent = 22
  const drainDepletionExtent = 22 + (inputs.vds / 3) * 20
  const excessDrainVoltage = Math.max(inputs.vds - state.overdrive, 0)
  const pinchProgress =
    region === 'saturation'
      ? 1 - Math.exp(-excessDrainVoltage / PINCH_GROWTH_VOLTS)
      : 0
  const pinchRegionLength = MAX_PINCH_REGION_LENGTH * pinchProgress
  const pinchRegionStartX = DRAIN.left - pinchRegionLength
  const inversionEnd =
    region === 'saturation'
      ? (pinchRegionStartX - CHANNEL_START_X) / CHANNEL_LENGTH
      : channelEnd
  const channelPath = createChannelPath(state, inversionEnd)
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
        viewBox="0 0 820 500"
        role="img"
        aria-labelledby="cross-section-title cross-section-description"
      >
        <title id="cross-section-title">Interactive NMOS cross-section and bias circuit</title>
        <desc id="cross-section-description">
          Gate and drain voltage sources bias an NMOS device. Junction depletion wraps around
          the source and drain, while the gate creates a separate surface depletion region and
          an inversion channel directly beneath the oxide.
        </desc>

        <defs>
          <pattern id="depletion-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M -2 2 L 2 -2 M 0 12 L 12 0 M 10 14 L 14 10" />
          </pattern>
          <pattern id="junction-hatch" width="9" height="9" patternUnits="userSpaceOnUse">
            <path d="M 0 9 L 9 0" />
          </pattern>
          <filter id="electron-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="bias-circuit">
          <g aria-label="VGS voltage source" className="voltage-source voltage-source--gate">
            <path d="M 70 177 V 70 H 211 M 259 70 H 410 V 139" />
            <circle cx="235" cy="70" r="24" />
            <text className="polarity" x="224" y="75" textAnchor="middle">−</text>
            <text className="polarity" x="246" y="75" textAnchor="middle">+</text>
            <text className="supply-label" x="235" y="31" textAnchor="middle">
              VGS {inputs.vgs.toFixed(2)} V
            </text>
          </g>
          <g aria-label="VDS voltage source" className="voltage-source voltage-source--drain">
            <path d="M 643 230 V 94 H 752 V 121 M 752 169 V 189" />
            <circle cx="752" cy="145" r="24" />
            <text className="polarity" x="752" y="138" textAnchor="middle">+</text>
            <text className="polarity" x="752" y="160" textAnchor="middle">−</text>
            <text className="supply-label" x="752" y="56" textAnchor="middle">
              VDS {inputs.vds.toFixed(2)} V
            </text>
          </g>
          <path className="source-wire" d="M 178 230 V 177 H 70" />
          <GroundReference x={70} y={190} />
          <GroundReference x={752} y={202} />
        </g>

        <rect
          className="substrate"
          data-testid="substrate"
          data-surface-y={SURFACE_Y}
          x="45"
          y={SURFACE_Y}
          width="730"
          height="225"
          rx="4"
        />

        <path
          className="pn-depletion pn-depletion--source"
          data-testid="source-junction-depletion"
          data-wraps-junction="sidewalls-and-bottom"
          data-p-side-extent={sourceDepletionExtent}
          d={pSideDepletionShape(SOURCE, sourceDepletionExtent)}
        />
        <path
          className="pn-depletion pn-depletion--drain"
          data-testid="drain-junction-depletion"
          data-wraps-junction="sidewalls-and-bottom"
          data-p-side-extent={drainDepletionExtent}
          d={pSideDepletionShape(DRAIN, drainDepletionExtent)}
        />

        {gateDepletionDepth > 0 && (
          <path
            className="gate-depletion"
            data-testid="gate-depletion"
            data-bottom-edge="flat-with-edge-fringing"
            data-depletion-depth={gateDepletionDepth}
            d={`M ${CHANNEL_START_X} ${SURFACE_Y} H ${
              CHANNEL_START_X + CHANNEL_LENGTH
            } V ${SURFACE_Y + gateDepletionDepth - gateDepletionEdgeRadius} Q ${
              CHANNEL_START_X + CHANNEL_LENGTH
            } ${SURFACE_Y + gateDepletionDepth} ${
              CHANNEL_START_X + CHANNEL_LENGTH - gateDepletionEdgeRadius
            } ${SURFACE_Y + gateDepletionDepth} H ${
              CHANNEL_START_X + gateDepletionEdgeRadius
            } Q ${CHANNEL_START_X} ${SURFACE_Y + gateDepletionDepth} ${CHANNEL_START_X} ${
              SURFACE_Y + gateDepletionDepth - gateDepletionEdgeRadius
            } Z`}
          />
        )}

        <path className="junction" d={junctionShape(SOURCE)} />
        <path className="junction" d={junctionShape(DRAIN)} />
        <path
          className="junction-rim"
          d={`M ${SOURCE.left + 7} ${SURFACE_Y + 7} V ${SOURCE.bottom - 18} Q ${
            SOURCE.left + 7
          } ${SOURCE.bottom - 7} ${SOURCE.left + 18} ${SOURCE.bottom - 7} H ${
            SOURCE.right - 18
          } Q ${SOURCE.right - 7} ${SOURCE.bottom - 7} ${SOURCE.right - 7} ${
            SOURCE.bottom - 18
          } V ${SURFACE_Y + 7}`}
        />
        <path
          className="junction-rim"
          d={`M ${DRAIN.left + 7} ${SURFACE_Y + 7} V ${DRAIN.bottom - 18} Q ${
            DRAIN.left + 7
          } ${DRAIN.bottom - 7} ${DRAIN.left + 18} ${DRAIN.bottom - 7} H ${
            DRAIN.right - 18
          } Q ${DRAIN.right - 7} ${DRAIN.bottom - 7} ${DRAIN.right - 7} ${
            DRAIN.bottom - 18
          } V ${SURFACE_Y + 7}`}
        />

        <rect
          className="oxide"
          data-testid="gate-oxide"
          x={CHANNEL_START_X}
          y={OXIDE_Y}
          width={CHANNEL_LENGTH}
          height={OXIDE_HEIGHT}
          rx="2"
        />
        <rect
          className="gate"
          data-testid="gate-metal"
          x={CHANNEL_START_X}
          y="139"
          width={CHANNEL_LENGTH}
          height="65"
          rx="4"
        />

        {region === 'saturation' && (
          <path
            className="pinch-wedge"
            data-pinch-progress={pinchProgress}
            d={`M ${pinchRegionStartX} ${SURFACE_Y} L ${DRAIN.left} ${SURFACE_Y} L ${
              DRAIN.left
            } 282 Q ${pinchRegionStartX + pinchRegionLength * 0.55} 269 ${
              pinchRegionStartX
            } ${
              SURFACE_Y
            } Z`}
          />
        )}

        {channelPath && (
          <path
            className="inversion-channel"
            data-testid="inversion-channel"
            data-channel-end={channelEnd}
            data-inversion-end={inversionEnd}
            data-transport-end={channelEnd}
            data-interface-y={SURFACE_Y}
            d={channelPath}
          />
        )}

        {isWeakInversion && (
          <g className="weak-inversion-electrons" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <circle
                key={index}
                cx={267 + index * 31}
                cy={SURFACE_Y + 3 + (index % 2) * 3}
                r="2.4"
              />
            ))}
          </g>
        )}

        {channelPath && (
          <g
            className="channel-electrons"
            data-testid="channel-carriers"
            aria-hidden="true"
            filter="url(#electron-glow)"
          >
            {Array.from({ length: electronCount }, (_, index) => {
              const progress = (index + 0.5) / electronCount
              const x = CHANNEL_START_X + progress * inversionEnd * CHANNEL_LENGTH
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

        {region === 'saturation' && pinchRegionLength > 1 && (
          <g
            className="pinch-off-carriers"
            data-testid="pinch-off-carriers"
            data-flow-to-drain="true"
            aria-label="Electrons swept across the pinch-off region to the drain"
            filter="url(#electron-glow)"
          >
            {Array.from({ length: 2 }, (_, index) => {
              const progress = (index + 0.5) / 2
              const style = {
                '--electron-delay': `${-index * 0.11}s`,
              } as CSSProperties

              return (
                <circle
                  key={index}
                  className="electron electron--high-field"
                  cx={pinchRegionStartX + progress * pinchRegionLength}
                  cy={SURFACE_Y + 4 + (index % 2) * 4}
                  r="2.7"
                  style={style}
                />
              )
            })}
          </g>
        )}

        <g className="holes" aria-hidden="true">
          {HOLES.map(([x, y], index) => {
            const underGate = x > 240 && x < 580 && y < 345
            const opacity = underGate
              ? Math.max(0.06, 1 - gateDepletionProgress * 1.15)
              : 0.68
            return (
              <g key={index} transform={`translate(${x} ${y})`} opacity={opacity}>
                <circle r="7" />
                <path d="M -3.5 0 H 3.5 M 0 -3.5 V 3.5" />
              </g>
            )
          })}
        </g>

        <g className="device-labels">
          <text x="178" y="218" textAnchor="middle">SOURCE</text>
          <text x="643" y="218" textAnchor="middle">DRAIN</text>
          <text x="410" y="130" textAnchor="middle">GATE</text>
          <text x="178" y="274" textAnchor="middle">n+</text>
          <text x="643" y="274" textAnchor="middle">n+</text>
          <text x="410" y="179" textAnchor="middle">metal</text>
          <text x="410" y="221" textAnchor="middle">oxide</text>
          <text x="410" y="434" textAnchor="middle">p-type substrate</text>
        </g>

        <g className="diagram-annotations">
          {gateDepletionDepth > 0 && (
            <>
              <path d={`M 401 ${SURFACE_Y + gateDepletionDepth + 6} L 445 329`} />
              <text x="451" y="334">Gate-induced depletion</text>
            </>
          )}
          <path d="M 135 326 L 95 355" />
          <text x="58" y="371">PN depletion</text>
          {channelPath && (
            <>
              <path d="M 322 246 L 289 275" />
              <text x="278" y="291">Inversion channel</text>
            </>
          )}
          {isWeakInversion && (
            <text x="410" y="263" textAnchor="middle">Qualitative weak inversion</text>
          )}
          {region === 'saturation' && pinchRegionLength > 10 && (
            <>
              <path d={`M ${pinchRegionStartX + 8} 242 L ${
                pinchRegionStartX + 32
              } 273`} />
              <text x={pinchRegionStartX - 5} y="288">Pinch-off region</text>
            </>
          )}
        </g>

        <g className="body-contact">
          <path d="M 410 455 V 469" />
          <GroundReference x={410} y={469} />
        </g>
      </svg>

      <div className="diagram-legend" aria-label="Carrier and region legend">
        <span><i className="legend-dot legend-dot--electron" />Electron</span>
        <span><i className="legend-dot legend-dot--hole">+</i>Hole</span>
        <span><i className="legend-swatch legend-swatch--pn" />PN depletion</span>
        <span><i className="legend-swatch" />Gate depletion</span>
      </div>
    </figure>
  )
}
