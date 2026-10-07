import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { deriveMosfetState } from '../model/mosfetModel'
import { NMOSCrossSection } from './NMOSCrossSection'

describe('NMOSCrossSection', () => {
  it('shows the qualitative weak-inversion state below threshold', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 0.6, vds: 0, vt: 0.7 })}
      />,
    )

    expect(
      screen.getByText('Qualitative weak inversion'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('inversion-channel')).not.toBeInTheDocument()
  })

  it('renders a tapered inversion channel in triode', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })}
      />,
    )

    expect(screen.getByTestId('inversion-channel')).toBeInTheDocument()
    expect(screen.getByText('Inversion channel')).toBeInTheDocument()
    expect(screen.queryByText('Pinch-off region')).not.toBeInTheDocument()
  })

  it('shows the drain-side pinch-off region in saturation', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 2, vt: 0.5 })}
      />,
    )

    const channel = screen.getByTestId('inversion-channel')
    expect(Number(channel.getAttribute('data-channel-end'))).toBeLessThan(1)
    expect(screen.getByText('Pinch-off region')).toBeInTheDocument()
  })
})
