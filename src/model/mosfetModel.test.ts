import { describe, expect, it } from 'vitest'

import {
  deriveMosfetState,
  sampleOutputCurve,
  type MosfetInputs,
} from './mosfetModel'

const derive = (overrides: Partial<MosfetInputs> = {}) =>
  deriveMosfetState({ vgs: 1.5, vds: 1, vt: 0.7, ...overrides })

describe('deriveMosfetState', () => {
  it('treats gate voltage below threshold as cutoff', () => {
    const state = derive({ vgs: 0.6, vt: 0.7 })

    expect(state.region).toBe('cutoff')
    expect(state.normalizedId).toBe(0)
  })

  it('treats gate voltage equal to threshold as cutoff', () => {
    const state = derive({ vgs: 0.7, vt: 0.7 })

    expect(state.region).toBe('cutoff')
    expect(state.normalizedId).toBe(0)
  })

  it('calculates normalized current in triode', () => {
    const state = derive({ vgs: 1.5, vt: 0.5, vds: 0.5 })

    expect(state.region).toBe('triode')
    expect(state.normalizedId).toBeCloseTo(0.375)
  })

  it('assigns the pinch-off boundary to saturation', () => {
    const state = derive({ vgs: 1.5, vt: 0.5, vds: 1 })

    expect(state.region).toBe('saturation')
    expect(state.isAtPinchOff).toBe(true)
    expect(state.normalizedId).toBeCloseTo(0.5)
  })

  it('keeps ideal saturation current constant as drain voltage rises', () => {
    const boundary = derive({ vgs: 1.5, vt: 0.5, vds: 1 })
    const beyond = derive({ vgs: 1.5, vt: 0.5, vds: 2.5 })

    expect(beyond.normalizedId).toBeCloseTo(boundary.normalizedId)
  })

  it('marks weak inversion only in the qualitative threshold band', () => {
    expect(derive({ vgs: 0.6, vt: 0.7 }).isWeakInversion).toBe(true)
    expect(derive({ vgs: 0.5, vt: 0.7 }).isWeakInversion).toBe(false)
    expect(derive({ vgs: 0.8, vt: 0.7 }).isWeakInversion).toBe(false)
  })

  it('creates a monotonic non-negative triode channel profile', () => {
    const state = derive({ vgs: 1.5, vt: 0.5, vds: 0.5 })
    const charges = state.channelProfile.map((point) => point.charge)

    expect(charges.at(0)).toBeCloseTo(1)
    expect(charges.at(-1)).toBeCloseTo(0.5)
    expect(charges.every((charge) => charge >= 0)).toBe(true)
    expect(charges.every((charge, index) => index === 0 || charge <= charges[index - 1])).toBe(true)
  })

  it('keeps the ideal-model pinch-off boundary at the drain edge', () => {
    const state = derive({ vgs: 0.3, vt: 0.2, vds: 3 })

    expect(state.channelEnd).toBe(1)
    expect(state.channelProfile.at(-1)?.x).toBe(1)
    expect(state.channelProfile.at(-1)?.charge).toBe(0)
  })

  it('clamps invalid and out-of-range inputs', () => {
    const state = deriveMosfetState({ vgs: Number.NaN, vds: 99, vt: -4 })

    expect(state.inputs).toEqual({ vgs: 0, vds: 3, vt: 0.2 })
    expect(Number.isFinite(state.normalizedId)).toBe(true)
  })
})

describe('sampleOutputCurve', () => {
  it('samples an inclusive zero-to-three-volt output curve', () => {
    const curve = sampleOutputCurve(1.5, 0.5)

    expect(curve).toHaveLength(61)
    expect(curve[0]).toMatchObject({ vds: 0, normalizedId: 0 })
    expect(curve.at(-1)).toMatchObject({ vds: 3, normalizedId: 0.5 })
  })
})
