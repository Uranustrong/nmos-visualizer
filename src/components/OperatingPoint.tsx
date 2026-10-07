import type { MosfetState } from '../model/mosfetModel'

interface OperatingPointProps {
  state: MosfetState
}

const REGION_COPY = {
  cutoff: {
    name: 'Cutoff',
    condition: 'VGS ≤ VT',
    equation: 'ID* = 0',
    note: 'No conducting inversion channel',
  },
  triode: {
    name: 'Triode',
    condition: 'VDS < VGS − VT',
    equation: 'ID* = (VGS − VT)VDS − VDS²/2',
    note: 'Channel connects source and drain',
  },
  saturation: {
    name: 'Saturation',
    condition: 'VDS ≥ VGS − VT',
    equation: 'ID* = (VGS − VT)²/2',
    note: 'Channel is pinched off near the drain',
  },
} as const

export function OperatingPoint({ state }: OperatingPointProps) {
  const copy = REGION_COPY[state.region]

  return (
    <aside className="operating-card" aria-live="polite">
      <div className="operating-card__region">
        <span className="eyebrow">Operating region</span>
        <h2>{copy.name}</h2>
        <p>{state.isAtPinchOff ? 'At the pinch-off boundary' : copy.note}</p>
      </div>
      <div className="operating-card__math">
        <span className="condition">{copy.condition}</span>
        <code>{copy.equation}</code>
      </div>
      <div className="operating-card__current">
        <span>Normalized current</span>
        <strong data-testid="normalized-current">ID* = {state.normalizedId.toFixed(3)}</strong>
      </div>
    </aside>
  )
}
