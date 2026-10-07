import { useMemo, useState } from 'react'

import { Controls } from './components/Controls'
import { IVChart } from './components/IVChart'
import { NMOSCrossSection } from './components/NMOSCrossSection'
import { OperatingPoint } from './components/OperatingPoint'
import { deriveMosfetState } from './model/mosfetModel'

export function App() {
  const [vgs, setVgs] = useState(1.5)
  const [vds, setVds] = useState(1)
  const [vt, setVt] = useState(0.7)
  const state = useMemo(() => deriveMosfetState({ vgs, vds, vt }), [vgs, vds, vt])

  return (
    <main className="app-shell">
      <header className="site-header">
        <div>
          <span className="site-index">01 / DEVICE PHYSICS</span>
          <h1>NMOS Field Lab</h1>
        </div>
        <p>
          Shape the channel. Move the operating point. See one ideal long-channel model from two views.
        </p>
      </header>

      <section className="visualization-grid" aria-label="Synchronized NMOS visualizations">
        <NMOSCrossSection state={state} />
        <IVChart state={state} />
      </section>

      <section className="lab-console" aria-label="Live operating point controls">
        <Controls
          vgs={vgs}
          vds={vds}
          vt={vt}
          setVgs={setVgs}
          setVds={setVds}
          setVt={setVt}
        />
        <OperatingPoint state={state} />
      </section>

      <footer className="site-footer">
        <p>Ideal long-channel square-law model · Diagram is qualitative and not drawn to scale.</p>
        <p>Normalized current · Channel-length modulation omitted</p>
      </footer>
    </main>
  )
}
