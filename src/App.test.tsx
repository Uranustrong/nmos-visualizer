import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('starts at the specified default operating point', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'NMOS Field Lab' })).toBeInTheDocument()
    expect(screen.getByText('Saturation')).toBeInTheDocument()
    expect(screen.getByLabelText('Gate voltage VGS')).toHaveValue('1.5')
    expect(screen.getByLabelText('Drain voltage VDS')).toHaveValue('1')
    expect(screen.getByLabelText('Threshold voltage VT')).toHaveValue('0.7')
  })

  it('updates region, current, and chart marker from the drain slider', () => {
    render(<App />)
    const drainSlider = screen.getByLabelText('Drain voltage VDS')

    fireEvent.change(drainSlider, { target: { value: '0.5' } })

    expect(screen.getByText('Triode')).toBeInTheDocument()
    expect(screen.getByTestId('normalized-current')).toHaveTextContent('0.275')
    expect(screen.getByTestId('operating-point')).toHaveAttribute('data-vds', '0.5')
  })

  it('shows qualitative weak inversion while normalized current stays zero', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Gate voltage VGS'), {
      target: { value: '0.6' },
    })

    expect(screen.getByText('Qualitative weak inversion')).toBeInTheDocument()
    expect(screen.getByText('Cutoff')).toBeInTheDocument()
    expect(screen.getByTestId('normalized-current')).toHaveTextContent('0.000')
  })

  it('exposes slider bounds and keyboard-ready range inputs', () => {
    render(<App />)

    const gateSlider = screen.getByLabelText('Gate voltage VGS')
    const drainSlider = screen.getByLabelText('Drain voltage VDS')
    const thresholdSlider = screen.getByLabelText('Threshold voltage VT')

    expect(gateSlider).toHaveAttribute('type', 'range')
    expect(gateSlider).toHaveAttribute('min', '0')
    expect(gateSlider).toHaveAttribute('max', '3')
    expect(drainSlider).toHaveAttribute('step', '0.05')
    expect(thresholdSlider).toHaveAttribute('min', '0.2')
    expect(thresholdSlider).toHaveAttribute('max', '1.2')
  })
})
