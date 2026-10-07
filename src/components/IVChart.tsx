import { sampleOutputCurve, type MosfetState, type OutputCurvePoint } from '../model/mosfetModel'

interface IVChartProps {
  state: MosfetState
}

const REFERENCE_VGS = [0.5, 1, 1.5, 2, 2.5, 3]
const WIDTH = 620
const HEIGHT = 430
const MARGIN = { top: 28, right: 30, bottom: 64, left: 72 }
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom
const X_MAX = 3
const Y_MAX = 4

const xScale = (value: number) => MARGIN.left + (value / X_MAX) * PLOT_WIDTH
const yScale = (value: number) => MARGIN.top + PLOT_HEIGHT - (value / Y_MAX) * PLOT_HEIGHT

const curvePath = (points: OutputCurvePoint[]) =>
  points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(point.vds).toFixed(2)} ${yScale(point.normalizedId).toFixed(2)}`
    })
    .join(' ')

export function IVChart({ state }: IVChartProps) {
  const liveCurve = sampleOutputCurve(state.inputs.vgs, state.inputs.vt)
  const operatingX = xScale(state.inputs.vds)
  const operatingY = yScale(state.normalizedId)
  const boundaryVds = state.pinchOffVds
  const boundaryId = boundaryVds === null ? 0 : (boundaryVds ** 2) / 2

  return (
    <figure className="diagram iv-chart">
      <figcaption className="panel-heading">
        <span className="eyebrow">Output view</span>
        <span>Drain characteristics</span>
      </figcaption>

      <svg
        className="iv-chart__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby="iv-chart-title iv-chart-description"
      >
        <title id="iv-chart-title">NMOS drain current characteristic curves</title>
        <desc id="iv-chart-description">
          Reference curves for six gate voltages, with a highlighted live curve and operating point.
        </desc>

        <g className="chart-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((tick) => (
            <line
              key={`y-${tick}`}
              x1={MARGIN.left}
              x2={MARGIN.left + PLOT_WIDTH}
              y1={yScale(tick)}
              y2={yScale(tick)}
            />
          ))}
          {[0, 1, 2, 3].map((tick) => (
            <line
              key={`x-${tick}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={MARGIN.top}
              y2={MARGIN.top + PLOT_HEIGHT}
            />
          ))}
        </g>

        <g className="chart-axes">
          <path d={`M ${MARGIN.left} ${MARGIN.top} V ${MARGIN.top + PLOT_HEIGHT} H ${MARGIN.left + PLOT_WIDTH}`} />
          {[0, 1, 2, 3].map((tick) => (
            <text key={`x-label-${tick}`} x={xScale(tick)} y={MARGIN.top + PLOT_HEIGHT + 27} textAnchor="middle">
              {tick}
            </text>
          ))}
          {[0, 1, 2, 3, 4].map((tick) => (
            <text key={`y-label-${tick}`} x={MARGIN.left - 18} y={yScale(tick) + 4} textAnchor="end">
              {tick}
            </text>
          ))}
          <text className="axis-title" x={MARGIN.left + PLOT_WIDTH / 2} y={HEIGHT - 10} textAnchor="middle">
            VDS (V)
          </text>
          <text
            className="axis-title"
            x={18}
            y={MARGIN.top + PLOT_HEIGHT / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${MARGIN.top + PLOT_HEIGHT / 2})`}
          >
            Normalized ID
          </text>
        </g>

        <g className="reference-curves" aria-hidden="true">
          {REFERENCE_VGS.map((vgs) => (
            <path
              key={vgs}
              data-testid="reference-curve"
              d={curvePath(sampleOutputCurve(vgs, state.inputs.vt))}
            />
          ))}
        </g>

        <path
          className="live-curve"
          data-testid="live-curve"
          d={curvePath(liveCurve)}
        />

        {boundaryVds !== null && boundaryVds <= X_MAX && (
          <g
            className="pinch-off-marker"
            data-testid="pinch-off-marker"
            data-vds={boundaryVds}
            transform={`translate(${xScale(boundaryVds)} ${yScale(boundaryId)})`}
          >
            <circle r="5" />
            <path d="M 0 -8 V -28 H 10" />
            <text x="14" y="-24">pinch-off</text>
          </g>
        )}

        <g
          className="operating-point"
          data-testid="operating-point"
          data-vds={state.inputs.vds}
          data-id={state.normalizedId}
          transform={`translate(${operatingX} ${operatingY})`}
        >
          <circle className="operating-point__halo" r="11" />
          <circle className="operating-point__dot" r="5" />
        </g>

        <g className="chart-key" transform={`translate(${MARGIN.left + 14} ${MARGIN.top + 18})`}>
          <path className="chart-key__reference" d="M 0 0 H 28" />
          <text x="36" y="4">reference VGS</text>
          <path className="chart-key__live" d="M 142 0 H 170" />
          <text x="178" y="4">live VGS = {state.inputs.vgs.toFixed(2)} V</text>
        </g>
      </svg>
    </figure>
  )
}
