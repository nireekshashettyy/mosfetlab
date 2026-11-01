import { compute } from './engine/mosfet.js'
const pick = a => a[Math.floor(Math.random() * a.length)], sh = a => [...a].sort(() => Math.random() - .5), fx = x => (+x.toFixed(2)).toString()
const mk = (q, correct, wrong, explain, level, type, meta) => {
  const w = [...new Set(wrong)].filter(x => x !== correct); const opts = sh([correct, ...w.slice(0, 3)])
  return { q, opts, ans: opts.indexOf(correct), explain, level, type, meta }
}
const numOpts = (c, cands) => {
  const w = cands.filter(x => isFinite(x) && x >= 0).map(x => fx(x) + ' mA'); const cc = fx(c) + ' mA'
  for (const k of [1, 2, 0.5, 3, 4, 6]) w.push(fx(c + k) + ' mA'); return [cc, w]
}
const params = () => ({ vgs: pick([0.5, 1, 2, 3, 4, 5]), vds: pick([0.5, 1, 2, 3, 4]), vth: pick([1, 1.5]), kn: pick([1, 2, 4]) })
const CONCEPT = [
  ['beginner', 'Which condition forms the inversion channel in an enhancement-mode NMOS?', 'VGS > VTH', ['VGS < VTH', 'VDS > VGS', 'VDS = 0'], 'The gate field must attract enough electrons to the surface: VGS must exceed VTH.'],
  ['beginner', 'Inside the channel, electrons move from…', 'source to drain', ['drain to source', 'gate to substrate', 'through the gate oxide'], 'Electrons drift source → drain, so conventional current ID flows drain → source. The oxide blocks carriers.'],
  ['beginner', 'At pinch-off the channel…', 'is very thin near the drain but does not vanish', ['disappears and ID becomes zero', 'is thickest at the drain', 'extends into the oxide'], 'Charge density at the drain end falls toward zero, but carriers still cross the high-field pinch-off region, so ID continues.'],
  ['beginner', 'The triode/saturation boundary is at…', 'VDS = VGS − VTH', ['VDS = VGS + VTH', 'VGS = VTH', 'VDS = 0'], 'Saturation begins when VDS ≥ VOV = VGS − VTH.'],
  ['intermediate', 'Why is ideal ID constant in saturation?', 'Extra VDS drops across the pinched-off region, so ID is set by VOV', ['The gate current rises', 'The channel gets longer with VDS', 'Electrons stop moving'], 'ID = (kn/2)VOV² has no VDS term in the ideal model.'],
  ['intermediate', 'In saturation, the ID–VGS curve above VTH is…', 'quadratic', ['linear', 'exponential', 'constant'], 'ID = (kn/2)(VGS − VTH)².']]
const GEN = {
  region(level) { const m = params(), r = compute(m); return mk(`VGS = ${m.vgs} V, VDS = ${m.vds} V, VTH = ${m.vth} V. Operating region?`, r.region, ['CUTOFF', 'TRIODE', 'SATURATION'], `VOV = ${m.vgs} − ${m.vth} = ${fx(r.vov)} V. ${r.region === 'CUTOFF' ? 'VGS ≤ VTH → cutoff.' : r.region === 'TRIODE' ? `VDS < VOV → triode.` : `VDS ≥ VOV → saturation.`}`, level, 'region', { ...m, region: r.region }) },
  numeric(level) {
    const m = params(), r = compute(m), v = Math.max(r.vov, 0)
    const [c, w] = numOpts(r.id, [m.kn * (v * m.vds - m.vds ** 2 / 2), m.kn * v * v, m.kn * v * m.vds, m.kn / 2 * v * m.vds])
    const eq = r.region === 'CUTOFF' ? 'VGS ≤ VTH → ID = 0' : r.region === 'TRIODE' ? `ID = kn[VOV·VDS − VDS²/2] = ${m.kn}[${fx(v)}×${m.vds} − ${fx(m.vds ** 2 / 2)}]` : `ID = (kn/2)VOV² = ${fx(m.kn / 2)} × ${fx(v * v)}`
    return mk(`kn = ${m.kn} mA/V², VGS = ${m.vgs} V, VDS = ${m.vds} V, VTH = ${m.vth} V. Find ID.`, c, w, `${eq} = ${fx(r.id)} mA.`, level, 'numeric', { ...m, id: r.id }) },
  graph(level) {
    const m = { ...params(), vds: 5 }; m.vgs = pick([2, 3, 4, 5]); const r = compute(m)
    const [c, w] = numOpts(r.id, [m.kn * r.vov ** 2, m.kn * r.vov, m.kn / 2 * r.vov])
    return mk(`On the output characteristics for VGS = ${m.vgs} V (VTH = ${m.vth} V, kn = ${m.kn} mA/V²), what is the flat (plateau) ID?`, c, w, `Plateau = saturation current (kn/2)VOV² = ${fx(m.kn / 2)} × ${fx(r.vov ** 2)} = ${fx(r.id)} mA.`, level, 'numeric', { ...m, id: r.id }) },
  double() { return mk('In saturation, VOV doubles (1 V → 2 V). ID changes by a factor of…', '4', ['2', '8', '1/2'], 'ID ∝ VOV², so doubling VOV quadruples ID.', 'intermediate', 'concept') },
  concept(level) { const c = pick(CONCEPT.filter(x => x[0] === level)); return mk(c[1], c[2], c[3], c[4], level, 'concept') }
}
export function makeQuestion(level) {
  const pool = level === 'beginner' ? ['region', 'region', 'concept'] : ['numeric', 'numeric', 'graph', 'double', 'concept']
  return GEN[pick(pool)](level)
}
