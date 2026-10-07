import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { deriveMosfetState } from '../model/mosfetModel'
import { IVChart } from './IVChart'

describe('IVChart', () => {
  it('draws six reference curves and one live curve without invalid geometry', () => {
    const state = deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })
    render(<IVChart state={state} />)

    expect(screen.getAllByTestId('reference-curve')).toHaveLength(6)
    expect(screen.getByTestId('live-curve')).toHaveAttribute('d')
    expect(screen.getByTestId('live-curve').getAttribute('d')).not.toContain('NaN')
  })

  it('positions the operating point at the current voltages', () => {
    const state = deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })
    render(<IVChart state={state} />)

    expect(screen.getByTestId('operating-point')).toHaveAttribute('data-vds', '0.5')
    expect(screen.getByTestId('operating-point')).toHaveAttribute('data-id', '0.375')
  })

  it('shows a boundary marker only when overdrive is positive', () => {
    const { rerender } = render(
      <IVChart state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })} />,
    )

    expect(screen.getByTestId('pinch-off-marker')).toHaveAttribute('data-vds', '1')

    rerender(
      <IVChart state={deriveMosfetState({ vgs: 0.5, vds: 0.5, vt: 0.7 })} />,
    )
    expect(screen.queryByTestId('pinch-off-marker')).not.toBeInTheDocument()
  })
})
