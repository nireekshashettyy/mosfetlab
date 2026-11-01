
import React, { useEffect, useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MosfetSVG from './components/MosfetSVG.jsx'
import Control from './components/Control.jsx'
import { compute, REGION_COLOR, DEFAULTS } from './engine/mosfet.js'
import { makeQuestion } from './quiz.js'
const f = (x, d = 2) => (+x.toFixed(d)).toString()
const LIM = {
  vgs: [0, 5, 0.05, 'VGS', 'V'],
  vds: [0, 5, 0.05, 'VDS', 'V'],
  vth: [0.2, 3, 0.05, 'VTH', 'V'],

  w: [1, 100, 1, 'W (Width)', 'µm'],
  l: [0.1, 10, 0.1, 'L (Length)', 'µm'],
  mun: [50, 1000, 10, 'µn (Mobility)', 'cm²/V·s'],
  cox: [1, 20, 0.5, 'Cox', 'fF/µm²'],
  lambda: [0, 0.2, 0.005, 'λ (CLM)', 'V⁻¹']
}

export function Dashboard({ s, go }) {
  const cards = [['Live Simulator', 1, 'Change VGS, VDS and physical device parameters; watch the channel, equations and current respond together.'], ['Graph Laboratory', 2, 'Output and transfer characteristics from the same engine.'], ['Compare Modes', 3, 'Cutoff, triode and saturation side by side.'], ['Guided Experiments', 4, 'Record observations and draw conclusions.'], ['Learn MOSFET', 5, '13 short topics, each linked to the simulator.'], ['Quiz and Practice', 6, 'Generated questions with verified answers.']]
  return <div className="grid2 dashboard-page"><section className="panel"><h3>WELCOME</h3><p>One electrical input change → one physical structure change → one mathematical change → one graphical change.</p><MosfetSVG {...s} compact /></section>
    <section className="panel"><h3>START HERE</h3><div className="cards">{cards.map(([t, i, d]) => <button key={t} className="card" onClick={() => go(i)}><b>{t}</b><br /><small>{d}</small></button>)}</div></section></div>
}

const EXPS = [
  { t: '1. Channel formation', obj: 'See how the inversion channel forms once VGS exceeds VTH.', proc: 'Fix VDS = 2 V. Raise VGS from 0 V past VTH, recording at least one point below and one above threshold.', init: { vgs: 0, vds: 2, vth: 1 }, ctl: ['vgs'], task: 'Record a point at/below VTH and a point above VTH.', ok: r => r.some(x => x.region === 'CUTOFF') && r.some(x => x.region !== 'CUTOFF'), exp: 'No channel and ID = 0 until VGS > VTH; then the channel appears and strengthens with VGS.' },
  { t: '2. Effect of threshold voltage', obj: 'See how VTH changes overdrive and current at fixed VGS.', proc: 'Fix VGS = 3 V, VDS = 3 V. Vary VTH and record three different values.', init: { vgs: 3, vds: 3, vth: 1 }, ctl: ['vth'], task: 'Record three distinct VTH values.', ok: r => new Set(r.map(x => x.vth)).size >= 3, exp: 'Higher VTH → smaller VOV → much smaller ID (ID ∝ VOV² in saturation).' },
  { t: '3. Triode to saturation', obj: 'Observe pinch-off as VDS rises.', proc: 'Fix VGS = 3 V, VTH = 1 V. Raise VDS from 0, recording a triode point and a saturation point.', init: { vgs: 3, vds: 0, vth: 1 }, ctl: ['vds'], x: 'vds', task: 'Record one triode and one saturation point.', ok: r => r.some(x => x.region === 'TRIODE') && r.some(x => x.region === 'SATURATION'), exp: 'ID rises with VDS in triode. When VDS reaches VOV, saturation begins; CLM then causes a small further increase in ID.'},
  { t: '4. Output characteristics', obj: 'Build ID versus VDS for several VGS values.', proc: 'Choose a VGS, sweep VDS recording points; repeat for at least three VGS values.', init: { vgs: 2, vds: 0, vth: 1 }, ctl: ['vgs', 'vds'], x: 'vds', group: 'vgs', task: 'Record at least 6 points over 3 distinct VGS values (all above VTH).', ok: r => r.length >= 6 && new Set(r.filter(x => x.vgs > x.vth).map(x => x.vgs)).size >= 3, exp: 'Each VGS gives a rising curve followed by a gently sloping saturation region due to CLM. Higher VGS produces higher drain current.' },
  
  {
    t: '5. Transfer characteristics',
    obj: 'Build ID versus VGS at fixed VDS.',
    proc: 'Fix VDS = 4 V. Sweep VGS from 0 to 5 V recording at least 5 points, including some below VTH.',
    init: { vgs: 0, vds: 4, vth: 1 },
    ctl: ['vgs'],
    x: 'vgs',
    task: 'Record 5 points, at least one at/below VTH.',
    ok: r => r.length >= 5 && r.some(x => x.region === 'CUTOFF'),
    exp: 'ID = 0 up to VTH, then rises with VGS. In saturation, current also depends on λ and VDS.'
  },
  {
    t: '6. Geometry and process parameters',
    obj: 'Investigate how channel dimensions and process parameters affect kn and drain current.',
    proc: 'Start in saturation with VGS = 3 V, VDS = 3 V and VTH = 1 V. Change one parameter at a time: W, L, mobility or Cox. Record at least three observations.',
    init: { vgs: 3, vds: 3, vth: 1 },
    ctl: ['w', 'l', 'mun', 'cox'],
    x: 'w',
    task: 'Record at least 3 observations with different physical parameter combinations.',
    ok: r => r.length >= 3 && new Set(r.map(x => `${x.w}|${x.l}|${x.mun}|${x.cox}`)).size >= 3,
    exp: 'Increasing W, mobility or Cox increases kn and current. Increasing L decreases kn and current, with the other parameters held fixed.'
  },
  {
    t: '7. Channel-length modulation',
    obj: 'Investigate how λ affects saturation current.',
    proc: 'Fix VGS = 3 V and VTH = 1 V. Keep VDS above 2 V and vary both VDS and λ. Compare observations at λ = 0 and positive λ values.',
    init: { vgs: 3, vds: 2.5, vth: 1 },
    ctl: ['vds', 'lambda'],
    x: 'vds',
    group: 'lambda',
    task: 'Record at least 3 saturation observations with different λ and VDS combinations.',
    ok: r => r.length >= 3 && r.every(x => x.region === 'SATURATION') && new Set(r.map(x => `${x.lambda}|${x.vds}`)).size >= 3,
    exp: 'With λ = 0, saturation current is independent of VDS in this model. Positive λ produces a rising saturation curve.'
  }
]


function Experiment({ e }) {
  const [p, setP] = useState(() => ({ ...DEFAULTS, ...e.init })), [rows, setRows] = useState([]), [done, setDone] = useState(false), [note, setNote] = useState('')
  const r = compute({ ...p }), ok = e.ok(rows)
  const groups = e.group ? [...new Set(rows.map(x => x[e.group]))] : [null]
  return <section className="panel"><h3>{e.t}</h3>
    <p><b>Objective:</b> {e.obj}</p><p><b>Procedure:</b> {e.proc}</p><p><b>Task:</b> {e.task} <span className="tag" style={{ background: ok ? '#22c55e' : '#475569' }}>{ok ? 'COMPLETE' : 'IN PROGRESS'}</span></p>
    <div className="grid2e"><div><MosfetSVG {...p} compact />
      {e.ctl.map(k => (
  <Control
    key={k}
    label={LIM[k][3]}
    unit={LIM[k][4]}
    value={p[k]}
    min={LIM[k][0]}
    max={LIM[k][1]}
    step={LIM[k][2]}
    onChange={v => setP({ ...p, [k]: v })}
  />
))}
      <p className="expl" style={{ borderColor: REGION_COLOR[r.region] }}>{r.region} · ID = {f(r.id, 3)} mA</p>
      <div className="btns"><button onClick={() => setRows([
  ...rows,
  { ...p, kn: r.kn, id: r.id, region: r.region }
])}>
  Record observation
</button><button onClick={() => { setP({ ...DEFAULTS, ...e.init }); setRows([]); setDone(false); setNote('') }}>Reset</button></div></div>
      <div><div className="experiment-table-wrap">
  <table>
    <thead>
      <tr>
        <td>VGS</td>
        <td>VDS</td>
        <td>VTH</td>
        <td>W</td>
        <td>L</td>
        <td>kn</td>
        <td>λ</td>
        <td>ID (mA)</td>
        <td>Region</td>
      </tr>
    </thead>
    <tbody>
      {rows.map((x, i) => (
        <tr key={i}>
          <td>{f(x.vgs)}</td>
          <td>{f(x.vds)}</td>
          <td>{f(x.vth)}</td>
          <td>{f(x.w)}</td>
          <td>{f(x.l)}</td>
          <td>{f(x.kn, 4)}</td>
          <td>{f(x.lambda, 3)}</td>
          <td>{f(x.id, 3)}</td>
          <td>{x.region}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        {e.x && rows.length > 1 && <ResponsiveContainer width="100%" height={220}><ScatterChart margin={{ left: 0, right: 10, top: 10, bottom: 18 }}><CartesianGrid stroke="#1e293b" /><XAxis
  type="number"
  dataKey={e.x}
  name={e.x.toUpperCase()}
  domain={LIM[e.x] ? [LIM[e.x][0], LIM[e.x][1]] : [0, 5]}
  stroke="#94a3b8"
  label={{
    value: `${e.x.toUpperCase()} (${LIM[e.x]?.[4] || 'V'})`,
    position: 'insideBottom',
    offset: -10,
    fill: '#94a3b8'
  }}
/><YAxis type="number" dataKey="id" name="ID" stroke="#94a3b8" /><Tooltip /><Legend />
          {groups.map((g, i) => <Scatter key={g} name={g === null ? 'ID' : `${e.group.toUpperCase()}=${g}`} data={rows.filter(x => g === null || x[e.group] === g).sort((a, b) => a[e.x] - b[e.x])} fill={['#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa'][i % 5]} line />)}</ScatterChart></ResponsiveContainer>}
        <p><b>Expected observation:</b> {e.exp}</p>
        <p><b>Actual observation:</b> {rows.length ? `${rows.length} points recorded; ID ranged ${f(Math.min(...rows.map(x => x.id)), 2)}–${f(Math.max(...rows.map(x => x.id)), 2)} mA; regions seen: ${[...new Set(rows.map(x => x.region))].join(', ')}.` : 'Record observations to see a summary.'}</p>
        <label><b>Conclusion:</b><textarea value={note} onChange={e2 => { setNote(e2.target.value); setDone(false) }} placeholder="Write your conclusion…" /></label>
        <button disabled={!ok || note.length < 10} onClick={() => setDone(true)}>Submit conclusion</button> {done && <span className="tag" style={{ background: '#22c55e' }}>Submitted ✓</span>}</div></div></section>
}
export function Experiments() { const [i, setI] = useState(0); return <div><div className="btns">{EXPS.map((e, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)}>{e.t}</button>)}</div><Experiment key={i} e={EXPS[i]} /></div> }

const TOPICS = [
  ['Introduction to MOSFET', 'A MOSFET is a voltage-controlled switch/amplifier: the gate voltage controls current between source and drain, with almost no gate current.', { vgs: 3, vds: 1 }],
  ['MOSFET construction', 'An NMOS has a P-type substrate, two N+ regions (source, drain), a thin SiO₂ insulator and a gate electrode above the gap between them.', { vgs: 0 }],
  ['Enhancement-mode operation', 'At VGS = 0 there is no channel. The channel is enhanced (created) only when the gate voltage is high enough.', { vgs: 0, vds: 2 }],
  ['Threshold voltage', 'VTH is the VGS at which strong inversion begins and a conducting N-type channel forms under the oxide.', { vgs: 1, vds: 2 }],
  ['Overdrive voltage', 'VOV = VGS − VTH measures how far the gate is above threshold. It sets channel charge and the triode/saturation boundary.', { vgs: 3, vds: 0 }],
  ['Channel formation', 'The positive gate repels holes and attracts electrons to the surface. More VOV means more inversion charge density (shown as stronger shading).', { vgs: 4, vds: 0 }],
  ['Electron flow', 'With VDS > 0, electrons drift from source to drain in the channel. Conventional current ID flows from drain to source.', { vgs: 3, vds: 1 }],
  ['Cutoff region', 'VGS ≤ VTH: no strong inversion, ideal ID = 0.', { vgs: 0.5, vds: 3 }],
  ['Triode region', 'VGS > VTH and VDS < VOV: a continuous channel that tapers toward the drain. ID = kn[VOV·VDS − VDS²/2].', { vgs: 3, vds: 1 }],
  ['Saturation region', 'VDS ≥ VOV: ID = (kn/2)VOV²(1 + λVDS). Channel-length modulation causes a small increase in drain current as VDS increases.', { vgs: 3, vds: 4 }],
  ['Pinch-off', 'At VDS = VOV the inversion charge at the drain end falls toward zero. Beyond that the pinch-off point moves slightly toward the source and carriers cross a high-field region.', { vgs: 3, vds: 3.5 }],
  ['Output characteristics', 'ID versus VDS for fixed VGS: a rising triode curve followed by a gently sloping saturation region due to CLM. Higher VGS gives higher drain current.', { vgs: 3, vds: 2 }],
  ['Transfer characteristics', 'ID versus VGS for fixed VDS: zero below VTH, then quadratic in saturation.', { vgs: 3, vds: 4 }]]

const LEARN_DETAILS = [
  {'concept': 'A MOSFET uses an electric field from its insulated gate to control conduction between source and drain. NMOS devices are widely used as switches and amplifiers.', 'working': 'The gate oxide blocks steady DC gate current. Raising VGS above threshold creates an electron-rich path, while VDS drives electrons through it.', 'equation': 'VOV = VGS − VTH', 'example': 'With VGS = 3 V and VTH = 1 V, overdrive is 2 V.', 'takeaway': 'A MOSFET is voltage controlled; its gate draws negligible steady-state current in the ideal model.'},
  {'concept': 'An enhancement NMOS is built in a p-type body with two heavily doped n+ regions called source and drain. An insulating oxide separates the gate from the silicon.', 'working': 'The gate electric field changes carrier concentration near the surface of the p-type body. The body is normally connected to the source in this simplified model.', 'equation': 'VGS = VG − VS; VDS = VD − VS', 'example': 'If VG = 3 V, VS = 0 V and VD = 1 V, then VGS = 3 V and VDS = 1 V.', 'takeaway': 'The oxide electrically insulates the gate; the substrate, source and drain are distinct regions.'},
  {'concept': 'Enhancement NMOS devices are normally off when VGS = 0. A sufficiently positive gate voltage creates a conducting inversion channel.', 'working': 'Below threshold, the surface does not have a strong electron inversion layer. Above threshold, more gate voltage increases the inversion charge.', 'equation': 'Strong inversion: VGS > VTH', 'example': 'With VTH = 1 V, VGS = 0 V is cutoff; VGS = 3 V forms a channel.', 'takeaway': 'Enhancement means the conducting channel is induced by the gate voltage.'},
  {'concept': 'Threshold voltage marks the approximate onset of strong inversion at the semiconductor surface. It depends on device fabrication and body bias.', 'working': 'As the positive gate voltage rises, holes are depleted near the oxide. Eventually electrons become numerous enough to form strong inversion.', 'equation': 'VOV = VGS − VTH', 'example': 'At VGS = 2.5 V, raising VTH from 1 V to 1.5 V reduces VOV from 1.5 V to 1 V.', 'takeaway': 'Threshold is not a perfectly sharp physical on/off boundary: real MOSFETs conduct weakly below it.'},
  {'concept': 'Overdrive is the gate voltage above threshold. It is a convenient measure of channel strength in the long-channel ideal model.', 'working': 'Larger VOV increases inversion charge and the saturation current. It also increases the VDS value needed to reach saturation.', 'equation': 'VOV = VGS − VTH; saturation boundary VDS = VOV', 'example': 'For VGS = 3 V and VTH = 1 V, VOV = 2 V; saturation begins at VDS = 2 V.', 'takeaway': 'Overdrive controls both current magnitude and the triode-to-saturation transition.'},
  {'concept': 'The conducting NMOS channel is an electron inversion layer immediately below the gate oxide. It is not a new piece of silicon.', 'working': 'A positive gate repels holes, producing depletion, then attracts enough electrons to invert the surface. The charge distribution changes along the channel when VDS is applied.', 'equation': 'Approximate inversion charge magnitude ∝ VGS − VTH (near the source)', 'example': 'At VGS = 4 V and VTH = 1 V, the source-end overdrive is 3 V.', 'takeaway': 'In the simulator, channel shading represents inversion charge density, not physical thickness.'},
  {'concept': 'Electrons carry current through the NMOS inversion channel. Conventional current is defined opposite to the direction of electron drift.', 'working': 'With drain at a higher potential than source, the lateral electric field points toward the source, while negatively charged electrons drift toward the drain.', 'equation': 'VDS = VD − VS; VDS > 0 drives electron drift source → drain', 'example': 'For VGS = 3 V, VTH = 1 V and VDS = 1 V, a channel exists and electrons drift toward the drain.', 'takeaway': 'Electron motion is source to drain; conventional drain current is drain to source.'},
  {'concept': 'Cutoff means the gate bias is insufficient to create a strong inversion channel in the ideal enhancement NMOS model.', 'working': 'When VGS ≤ VTH, the ideal simulator sets ID to zero regardless of positive VDS. Real devices still have small subthreshold leakage.', 'equation': 'VGS ≤ VTH ⇒ ID ≈ 0 (ideal: ID = 0)', 'example': 'With VGS = 0.5 V and VTH = 1 V, ID = 0 mA in the simulator.', 'takeaway': 'Cutoff is the OFF state in the ideal model; real transistors are not perfectly leakage-free.'},
  {'concept': 'In the triode (linear) region, the inversion channel extends continuously from source toward drain. At small VDS the MOSFET behaves approximately like a voltage-controlled resistor.', 'working': 'Increasing VDS initially increases current. Channel charge is lower near the drain, so the channel tapers as VDS approaches overdrive.', 'equation': '0 ≤ VDS < VOV; ID = kn(VOV·VDS − VDS²/2)', 'example': 'For VOV = 2 V, VDS = 1 V and kn = 2 mA/V², ID = 2(2×1 − 1²/2) = 3 mA.', 'takeaway': 'The triode equation is nonlinear overall but approximately linear for very small VDS.'},
 
{
  'concept': 'Saturation begins when VDS reaches VOV. In the long-channel model with first-order channel-length modulation, drain current depends on gate overdrive and increases slightly with VDS.',
  'working': 'The inversion charge near the drain end approaches zero at the boundary. Beyond this point, the pinch-off region expands and the effective channel length decreases slightly, causing drain current to increase.',
  'equation': 'VDS ≥ VOV; ID = (kn/2)·VOV²·(1 + λVDS)',
  'example': 'With VOV = 2 V, kn = 2 mA/V², λ = 0.02 V⁻¹ and VDS = 3 V: ID = 4 × (1 + 0.02 × 3) = 4.24 mA.',
  'takeaway': 'Saturation does not mean perfectly constant current when CLM is present. Setting λ = 0 gives the ideal flat saturation model.'
},

  {'concept': 'Pinch-off is the disappearance of the inversion layer at the drain end, not the complete blockage of electron flow.', 'working': 'At VDS = VOV the drain-end inversion charge approaches zero. Electrons arriving from the channel cross the depletion/high-field region and continue to the drain.', 'equation': 'Pinch-off onset: VDS = VGS − VTH', 'example': 'For VGS = 3 V and VTH = 1 V, pinch-off begins near VDS = 2 V.', 'takeaway': 'Pinch-off does not mean ID becomes zero; the device is entering saturation.'},
  {'concept': 'Output characteristics plot drain current ID against VDS while holding VGS fixed. Each gate voltage gives a different curve.', 'equation': 'Boundary on each curve: VDS = VGS − VTH', 'example': 'With VTH = 1 V, curves for VGS = 2 V and 3 V reach saturation at VDS = 1 V and 2 V respectively.','working': 'At small VDS the curve rises through triode operation. At VDS = VOV it enters saturation. With channel-length modulation, the saturation curve has a small positive slope. Larger VGS gives higher drain current.',
'takeaway': 'Read the horizontal axis as VDS and the vertical axis as ID. The saturation curve is not perfectly flat when λ is greater than zero.'},
  {'concept': 'Transfer characteristics plot ID versus VGS at a fixed VDS. They show how the gate controls conduction.', 'working': 'Below threshold, the ideal current is zero. When VGS rises above threshold, current increases; it is quadratic in overdrive only while the chosen VDS keeps the device in saturation.', 'equation': 'In saturation: ID = (kn/2)(VGS − VTH)²(1 + λVDS)',
'example': 'At VDS = 4 V, VTH = 1 V, kn = 2 mA/V² and λ = 0.02 V⁻¹, VGS = 3 V gives ID = 4 × 1.08 = 4.32 mA.', 'takeaway': 'At fixed VDS, sufficiently high VGS can move the device into triode; the entire transfer curve is not always quadratic.'}
]

const LEARN_CHECKS = [
  {"question": "What primarily controls the drain current in an NMOS?", "options": ["Gate-to-source voltage", "Gate current", "Oxide thickness alone", "Ambient light"], "answer": 0, "explanation": "The insulated gate creates an electric field that controls channel charge and therefore drain current."},
  {"question": "What separates the gate electrode from the semiconductor?", "options": ["Copper wire", "Silicon dioxide insulation", "An air gap", "The drain contact"], "answer": 1, "explanation": "The thin gate oxide electrically insulates the gate while allowing an electric field to act on the channel."},
  {"question": "An enhancement NMOS at VGS = 0 is normally:", "options": ["ON", "In saturation", "OFF", "In breakdown"], "answer": 2, "explanation": "Without sufficient positive gate bias, no strong inversion channel forms."},
  {"question": "In the ideal model, strong inversion begins near:", "options": ["VDS = 0", "VGS = VTH", "ID = kn", "VGS = VDS always"], "answer": 1, "explanation": "Threshold voltage marks the approximate onset of strong inversion."},
  {"question": "If VGS = 3 V and VTH = 1 V, VOV is:", "options": ["1 V", "2 V", "3 V", "4 V"], "answer": 1, "explanation": "Overdrive is VOV = VGS − VTH = 2 V."},
  {"question": "What forms the conducting channel of an NMOS?", "options": ["A new metal layer", "An electron inversion layer", "Moving gate oxide", "A hole-only channel"], "answer": 1, "explanation": "Electrons accumulate near the oxide–silicon interface, creating an inversion layer."},
  {"question": "For positive VDS, electrons in the NMOS channel drift:", "options": ["Drain to source", "Gate to drain", "Source to drain", "Into the oxide"], "answer": 2, "explanation": "Negative electrons drift from source toward the higher-potential drain; conventional current is opposite."},
  {"question": "What is ideal ID when VGS ≤ VTH?", "options": ["0 mA", "Always 1 mA", "Infinite", "kn × VDS"], "answer": 0, "explanation": "The ideal model neglects subthreshold leakage, so cutoff current is zero."},
  {"question": "Which condition describes the triode region?", "options": ["VGS ≤ VTH", "VGS > VTH and VDS < VOV", "VDS ≥ VOV", "VDS < 0 only"], "answer": 1, "explanation": "A continuous inversion channel remains for VGS > VTH and VDS < VOV."},
 {
  "question": "In saturation with channel-length modulation, increasing VDS slightly makes ID:",
  "options": [
    "Increase slightly",
    "Fall to zero",
    "Remain exactly constant",
    "Reverse direction"
  ],
  "answer": 0,
  "explanation": "Channel-length modulation reduces the effective channel length, causing drain current to increase slightly as VDS increases. When λ = 0, the ideal model predicts constant saturation current."
},
  {"question": "Pinch-off means:", "options": ["All current stops", "Gate oxide breaks", "Drain-end inversion charge approaches zero", "Source and drain touch"], "answer": 2, "explanation": "Pinch-off is local to the drain end; carriers continue crossing the high-field region."},
  {"question": "An output characteristic plots:", "options": ["ID versus VDS at fixed VGS", "ID versus VGS at fixed VDS", "VTH versus temperature", "Gate current versus time"], "answer": 0, "explanation": "Output curves show drain current as drain voltage changes for a selected gate voltage."},
  {"question": "A transfer characteristic plots:", "options": ["VDS versus time", "ID versus VGS at fixed VDS", "Oxide thickness versus ID", "VTH versus VDS"], "answer": 1, "explanation": "Transfer curves show how the gate voltage controls drain current at fixed drain bias."}
]

export function Learn({ tryIt }) {
  const [o, setO] = useState(0)
  const [visited, setVisited] = useState(() => new Set([0]))
  const [mastered, setMastered] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem('mosfet-mastered-topics') || '[]'
    )

    return new Set(
      Array.isArray(saved)
        ? saved.filter(i =>
            Number.isInteger(i) && i >= 0 && i < 13
          )
        : []
    )
  } catch {
    return new Set()
  }
})
  const [answers, setAnswers] = useState({})
  useEffect(() => {
  localStorage.setItem(
    'mosfet-mastered-topics',
    JSON.stringify([...mastered])
  )
}, [mastered])

  const selectTopic = i => {
      setO(i)
    setVisited(old => new Set([...old, i]))
  }

  const [title, description, values] = TOPICS[o]
  const detail = LEARN_DETAILS[o]
  const check = LEARN_CHECKS[o]
  const chosen = answers[o]
  const correct = chosen === check.answer
  const chooseAnswer = i => {
    setAnswers(old => ({ ...old, [o]: i }))
    if (i === check.answer) setMastered(old => new Set([...old, o]))
  }

  return (
    <div className="learn-page">
      <section className="learn-heading">
        <div>
          <h2>Explore the NMOS transistor</h2>
          <p>Learn the concepts step by step, then test them in the simulator.</p>
        </div>
        <div className="learn-progress">
          <strong>{visited.size} / {TOPICS.length}</strong>
          <span>Topics explored · {mastered.size} mastered</span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${visited.size / TOPICS.length * 100}%` }}
            />
          </div>
        </div>
      </section>

      <div className="learn-layout">
        <aside className="learn-sidebar">
          <h3>LEARNING PATH</h3>
          <p className="learn-sidebar-note">Select a topic to explore</p>

          <div className="learn-topic-list">
            {TOPICS.map(([t], i) => (
              <button
                key={t}
                className={`learn-topic ${i === o ? 'active' : ''}`}
                onClick={() => selectTopic(i)}
              >
                <span className="topic-number">
                  {mastered.has(i) ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <span>{t}</span>
                {i === o && <span className="topic-arrow">›</span>}
              </button>
            ))}
          </div>
        </aside>

        <section className="learn-content">
          <div className="learn-content-top">
            <span className="learn-kicker">
              TOPIC {String(o + 1).padStart(2, '0')} OF {TOPICS.length}
            </span>
            <span className="learn-status">
              {mastered.has(o) ? 'Mastered ✓' : 'Exploring'}
            </span>
          </div>
 <h2>{title}</h2>

          <div className="learn-explanation">
            <h3>UNDERSTANDING THE CONCEPT</h3>
            <p>{description}</p>
            <p>{detail.concept}</p>
          </div>

          <div className="learn-explanation" style={{ marginTop: 16 }}>
            <h3>HOW IT WORKS</h3>
            <p>{detail.working}</p>
          </div>

          <div className="learn-explanation" style={{ marginTop: 16 }}>
            <h3>IMPORTANT EQUATION</h3>
            <p><strong>{detail.equation}</strong></p>
          </div>

          <div className="learn-explanation" style={{ marginTop: 16 }}>
            <h3>WORKED EXAMPLE</h3>
            <p>{detail.example}</p>
          </div>

          <div className="learn-explanation" style={{ marginTop: 16 }}>
            <h3>KEY TAKEAWAY</h3>
            <p>{detail.takeaway}</p>
          </div>

          <div className="learn-explanation" style={{ marginTop: 16 }}>
            <h3>CHECK YOUR UNDERSTANDING</h3>
            <p><strong>{check.question}</strong></p>
            <div style={{ display: 'grid', gap: 8 }}>
              {check.options.map((option, i) => (
                <button key={i} type="button"
                  onClick={() => chooseAnswer(i)}
                  disabled={correct}
                  aria-pressed={chosen === i}
                  style={{ textAlign: 'left', whiteSpace: 'normal',
                    border: chosen === i ? `2px solid ${correct ? '#16a34a' : '#dc2626'}` : undefined }}>
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              ))}
            </div>
            {chosen !== undefined && (
              <div role="status" style={{ marginTop: 12, padding: 12, borderRadius: 8,
                background: correct ? '#dcfce7' : '#fee2e2', color: correct ? '#14532d' : '#991b1b' }}>
                <strong>{correct ? 'Correct — topic mastered!' : 'Not quite — try again.'}</strong>
                <p style={{ marginBottom: 0, color: 'inherit' }}>{correct ? check.explanation : 'Review the explanation above and choose another answer.'}</p>
              </div>
            )}
          </div>

          {mastered.size === TOPICS.length && (
            <div role="status" style={{ marginTop: 16, padding: 18, background: '#dcfce7',
              color: '#14532d', borderRadius: 10 }}>
              <strong>🎓 MOSFET FUNDAMENTALS MASTERED!</strong>
              <p>You answered the knowledge check for all 13 topics correctly.</p>
            </div>
          )}

          <div className="learn-tip">
            <strong>Learning tip</strong>
            <p>
              Change the electrical inputs in the simulator and observe
              how the transistor's channel and drain current respond.
            </p>
          </div>

          <div className="learn-actions">
            <button
              className="learn-sim-button"
              onClick={() => tryIt(values)}
            >
              Try this in the simulator →
            </button>

            <div className="learn-navigation">
              <button
                disabled={o === 0}
                onClick={() => selectTopic(o - 1)}
              >
                ← Previous
              </button>
              <button
                disabled={o === TOPICS.length - 1}
                onClick={() => selectTopic(o + 1)}
              >
                Next topic →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


export function Quiz() {
  const [level, setLevel] = useState('beginner'), [q, setQ] = useState(() => makeQuestion('beginner')), [pick, setPick] = useState(null), [sc, setSc] = useState({ r: 0, t: 0 })
  const next = L => { setQ(makeQuestion(L)); setPick(null) }
  const ans = i => { if (pick !== null) return; setPick(i); setSc(s => ({ r: s.r + (i === q.ans), t: s.t + 1 })) }
  return <div className="panel" style={{ maxWidth: 760, margin: 'auto' }}><h3>QUIZ AND PRACTICE · Score {sc.r}/{sc.t}</h3>
    <div className="btns">{['beginner', 'intermediate'].map(L => <button key={L} className={L === level ? 'on' : ''} onClick={() => { setLevel(L); next(L) }}>{L}</button>)}<button onClick={() => setSc({ r: 0, t: 0 })}>Reset score</button></div>
    <p><b>{q.q}</b></p>{q.opts.map((o, i) => <button key={o} className={'opt ' + (pick === null ? '' : i === q.ans ? 'good' : i === pick ? 'bad' : '')} onClick={() => ans(i)}>{o}</button>)}
    
{pick !== null && (
  <div>
    <p
      className="expl"
      style={{
        borderColor: pick === q.ans ? '#22c55e' : '#ef4444'
      }}
    >
      <b>{pick === q.ans ? 'Correct.' : 'Not quite.'}</b>
      {' '}{q.explain}
    </p>

    <button onClick={() => next(level)}>
      Next question
    </button>
  </div>
)}
</div>
}
