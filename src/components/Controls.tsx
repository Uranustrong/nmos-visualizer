import type { Dispatch, SetStateAction } from 'react'

interface ControlsProps {
  vgs: number
  vds: number
  vt: number
  setVgs: Dispatch<SetStateAction<number>>
  setVds: Dispatch<SetStateAction<number>>
  setVt: Dispatch<SetStateAction<number>>
}

interface SliderProps {
  id: string
  label: string
  symbol: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function VoltageSlider({ id, label, symbol, value, min, max, onChange }: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="control">
      <div className="control__header">
        <label htmlFor={id}>
          <span className="control__symbol">{symbol}</span>
          <span>{label}</span>
        </label>
        <output htmlFor={id}>{value.toFixed(2)} V</output>
      </div>
      <input
        id={id}
        aria-label={`${label} ${symbol}`}
        type="range"
        min={min}
        max={max}
        step="0.05"
        value={value}
        style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="control__range" aria-hidden="true">
        <span>{min.toFixed(1)}</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  )
}

export function Controls({ vgs, vds, vt, setVgs, setVds, setVt }: ControlsProps) {
  return (
    <section className="controls" aria-label="MOSFET voltage controls">
      <VoltageSlider
        id="vgs-control"
        label="Gate voltage"
        symbol="VGS"
        value={vgs}
        min={0}
        max={3}
        onChange={setVgs}
      />
      <VoltageSlider
        id="vds-control"
        label="Drain voltage"
        symbol="VDS"
        value={vds}
        min={0}
        max={3}
        onChange={setVds}
      />
      <VoltageSlider
        id="vt-control"
        label="Threshold voltage"
        symbol="VT"
        value={vt}
        min={0.2}
        max={1.2}
        onChange={setVt}
      />
    </section>
  )
}
