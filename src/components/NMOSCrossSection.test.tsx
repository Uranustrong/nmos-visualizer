import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { deriveMosfetState } from '../model/mosfetModel'
import { NMOSCrossSection } from './NMOSCrossSection'

describe('NMOSCrossSection', () => {
  it('aligns the oxide, inversion channel, and substrate surface', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })}
      />,
    )

    const oxide = screen.getByTestId('gate-oxide')
    const channel = screen.getByTestId('inversion-channel')
    const substrate = screen.getByTestId('substrate')
    const oxideBottom = Number(oxide.getAttribute('y')) + Number(oxide.getAttribute('height'))

    expect(oxideBottom).toBe(Number(channel.getAttribute('data-interface-y')))
    expect(oxideBottom).toBe(Number(substrate.getAttribute('data-surface-y')))
  })

  it('matches gate metal length and position to the oxide', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })}
      />,
    )

    const oxide = screen.getByTestId('gate-oxide')
    const metal = screen.getByTestId('gate-metal')

    expect(metal).toHaveAttribute('x', oxide.getAttribute('x'))
    expect(metal).toHaveAttribute('width', oxide.getAttribute('width'))
  })

  it('wraps depletion regions around both source and drain pn junctions', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 1, vt: 0.5 })}
      />,
    )

    expect(screen.getByTestId('source-junction-depletion')).toHaveAttribute(
      'data-wraps-junction',
      'sidewalls-and-bottom',
    )
    expect(screen.getByTestId('drain-junction-depletion')).toHaveAttribute(
      'data-wraps-junction',
      'sidewalls-and-bottom',
    )
    expect(screen.getByTestId('gate-depletion')).toBeInTheDocument()
  })

  it('widens drain junction depletion as VDS rises without changing source depletion', () => {
    const { rerender } = render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })}
      />,
    )
    const sourceExtent = Number(
      screen.getByTestId('source-junction-depletion').getAttribute('data-p-side-extent'),
    )
    const lowDrainExtent = Number(
      screen.getByTestId('drain-junction-depletion').getAttribute('data-p-side-extent'),
    )

    rerender(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 3, vt: 0.5 })}
      />,
    )

    expect(
      Number(screen.getByTestId('source-junction-depletion').getAttribute('data-p-side-extent')),
    ).toBe(sourceExtent)
    expect(
      Number(screen.getByTestId('drain-junction-depletion').getAttribute('data-p-side-extent')),
    ).toBeGreaterThan(lowDrainExtent)
  })

  it('shows live VGS and VDS voltage sources with ground references', () => {
    render(
      <NMOSCrossSection
        state={deriveMosfetState({ vgs: 1.5, vds: 0.5, vt: 0.5 })}
      />,
    )

    expect(screen.getByLabelText('VGS voltage source')).toBeInTheDocument()
    expect(screen.getByLabelText('VDS voltage source')).toBeInTheDocument()
    expect(screen.getByText('VGS 1.50 V')).toBeInTheDocument()
    expect(screen.getByText('VDS 0.50 V')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Ground reference')).toHaveLength(3)
  })

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
    expect(Number(channel.getAttribute('data-channel-end'))).toBe(1)
    expect(screen.getByText('Pinch-off region')).toBeInTheDocument()
    expect(screen.getByTestId('pinch-off-carriers')).toHaveAttribute(
      'data-flow-to-drain',
      'true',
    )
  })
})
