
// Advanced long-channel square-law NMOS model.
// Units:
// V, mA, mA/V^2, um, cm^2/(V.s), fF/um^2, and V^-1.

// kn = μn × Cox × (W/L) × 10^-4
// Resulting kn is in mA/V^2.

export const DEFAULTS = {
  vgs: 0,
  vds: 0,
  vth: 1,

  // Device geometry
  w: 10,       // Channel width (um)
  l: 1,        // Channel length (um)

  // Process parameters
  mun: 450,    // Electron mobility (cm^2/V.s)
  cox: 7,      // Oxide capacitance (fF/um^2)

  // Channel-length modulation
  lambda: 0.02 // (1/V)

}

// Calculate kn from physical device parameters.
// Falls back to the old manually supplied kn if geometry
// or process parameters are unavailable or invalid.
export function calculateKn(p) {
  const { w, l, mun, cox, kn } = p

  if (
    Number.isFinite(w) &&
    Number.isFinite(l) &&
    Number.isFinite(mun) &&
    Number.isFinite(cox) &&
    w > 0 &&
    l > 0 &&
    mun > 0 &&
    cox > 0
  ) {
    return mun * cox * (w / l) * 1e-4
  }

  return Number.isFinite(kn) ? kn : 2
}

export function compute({ vgs, vds, vth, ...p }) {
  const kn = calculateKn(p)
  const lambda = Number.isFinite(p.lambda)
    ? Math.max(0, p.lambda)
    : 0

  const vov = vgs - vth

  // Output resistance approximation (kΩ).
 

  if (vgs <= vth) {
    return {
      vov,
      kn,
      id: 0,
      ro: Infinity,
      region: 'CUTOFF',
      channel: false,
      pinchoff: false,
      eq: 'cutoff'
    }
  }

  if (vds < vov) {
    const id = kn * (
      vov * vds - (vds * vds) / 2
    )

    return {
      vov,
      kn,
      id,
      ro: Infinity,
      region: 'TRIODE',
      channel: true,
      pinchoff: false,
      eq: 'triode'
    }
  }

  // Saturation with channel-length modulation.
  const idsat = (kn / 2) * vov * vov
  const id = idsat * (1 + lambda * vds)

  return {
    vov,
    kn,
    id,
    idsat,
    ro: lambda > 0 && id > 0
      ? 1 / (lambda * id)
      : Infinity,
    region: 'SATURATION',
    channel: true,
    pinchoff: true,
    eq: 'sat'
  }
}

export const outputCurve = (vgs, p, vmax = 5, step = 0.05) =>
  Array.from(
    { length: Math.round(vmax / step) + 1 },
    (_, i) => {
      const vds = +(i * step).toFixed(4)

      return {
        x: vds,
        y: compute({ ...p, vgs, vds }).id
      }
    }
  )

export const transferCurve = (vds, p, vmax = 5, step = 0.05) =>
  Array.from(
    { length: Math.round(vmax / step) + 1 },
    (_, i) => {
      const vgs = +(i * step).toFixed(4)

      return {
        x: vgs,
        y: compute({ ...p, vgs, vds }).id
      }
    }
  )

export const REGION_COLOR = {
  CUTOFF: '#64748b',
  TRIODE: '#22d3ee',
  SATURATION: '#f59e0b'
}

export const EXPLAIN = {
  CUTOFF:
    'The gate voltage is below threshold. No strong inversion channel is formed. The ideal drain current is zero.',

  TRIODE:
    'The gate voltage has exceeded threshold and an inversion channel is formed. Increasing VDS increases drain current.',

  SATURATION:
    'The drain voltage has reached the overdrive voltage. Pinch-off occurs near the drain. Channel-length modulation causes a small increase in drain current as VDS increases.'
}
