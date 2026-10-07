export const MOSFET_LIMITS = {
  vgs: { min: 0, max: 3 },
  vds: { min: 0, max: 3 },
  vt: { min: 0.2, max: 1.2 },
} as const

export type OperatingRegion = 'cutoff' | 'triode' | 'saturation'

export interface MosfetInputs {
  vgs: number
  vds: number
  vt: number
}

export interface ChannelPoint {
  x: number
  charge: number
}

export interface MosfetState {
  inputs: MosfetInputs
  region: OperatingRegion
  overdrive: number
  normalizedId: number
  pinchOffVds: number | null
  isAtPinchOff: boolean
  isWeakInversion: boolean
  channelEnd: number
  channelProfile: ChannelPoint[]
}

export interface OutputCurvePoint {
  vds: number
  normalizedId: number
  region: OperatingRegion
}

const CHANNEL_SAMPLE_COUNT = 25
const EPSILON = 1e-9

const clamp = (value: number, min: number, max: number) => {
  const finiteValue = Number.isFinite(value) ? value : min
  return Math.min(max, Math.max(min, finiteValue))
}

const sanitizeInputs = ({ vgs, vds, vt }: MosfetInputs): MosfetInputs => ({
  vgs: clamp(vgs, MOSFET_LIMITS.vgs.min, MOSFET_LIMITS.vgs.max),
  vds: clamp(vds, MOSFET_LIMITS.vds.min, MOSFET_LIMITS.vds.max),
  vt: clamp(vt, MOSFET_LIMITS.vt.min, MOSFET_LIMITS.vt.max),
})

const makeChannelProfile = (
  region: OperatingRegion,
  overdrive: number,
  vds: number,
  channelEnd: number,
): ChannelPoint[] => {
  if (region === 'cutoff') return []

  return Array.from({ length: CHANNEL_SAMPLE_COUNT }, (_, index) => {
    const progress = index / (CHANNEL_SAMPLE_COUNT - 1)
    const x = progress * channelEnd
    const charge =
      region === 'triode'
        ? Math.max(overdrive - vds * progress, 0)
        : Math.max(overdrive * (1 - progress), 0)

    return { x, charge }
  })
}

export const deriveMosfetState = (rawInputs: MosfetInputs): MosfetState => {
  const inputs = sanitizeInputs(rawInputs)
  const overdrive = Math.max(inputs.vgs - inputs.vt, 0)
  const isWeakInversion =
    inputs.vgs > 0.75 * inputs.vt && inputs.vgs <= inputs.vt

  let region: OperatingRegion = 'cutoff'
  let normalizedId = 0

  if (overdrive > 0 && inputs.vds < overdrive) {
    region = 'triode'
    normalizedId = overdrive * inputs.vds - (inputs.vds ** 2) / 2
  } else if (overdrive > 0) {
    region = 'saturation'
    normalizedId = (overdrive ** 2) / 2
  }

  const channelEnd = region === 'cutoff' ? 0 : 1
  const pinchOffVds = overdrive > 0 ? overdrive : null
  const isAtPinchOff =
    region === 'saturation' && Math.abs(inputs.vds - overdrive) <= EPSILON

  return {
    inputs,
    region,
    overdrive,
    normalizedId,
    pinchOffVds,
    isAtPinchOff,
    isWeakInversion,
    channelEnd,
    channelProfile: makeChannelProfile(
      region,
      overdrive,
      inputs.vds,
      channelEnd,
    ),
  }
}

export const sampleOutputCurve = (
  vgs: number,
  vt: number,
): OutputCurvePoint[] =>
  Array.from({ length: 61 }, (_, index) => {
    const vds = index * 0.05
    const state = deriveMosfetState({ vgs, vds, vt })
    return {
      vds,
      normalizedId: state.normalizedId,
      region: state.region,
    }
  })
