import React, { useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot, ReferenceLine, Brush, ResponsiveContainer } from 'recharts'
import Control from './components/Control.jsx'
import { Dashboard, Experiments, Learn, Quiz } from './Stage2.jsx'
import MosfetSVG from './components/MosfetSVG.jsx'
import { compute, outputCurve, transferCurve, DEFAULTS, REGION_COLOR, EXPLAIN } from './engine/mosfet.js'

const f = (x, d = 2) => (+x.toFixed(d)).toString()
const PRESETS = { 'Cutoff': { vgs: .5, vds: 2 }, 'Channel, VDS=0': { vgs: 3, vds: 0 }, 'Triode': { vgs: 3, vds: 1 }, 'Boundary': { vgs: 3, vds: 2 }, 'Saturation': { vgs: 3, vds: 4 } }


function Calc({ p }) {
  const r = compute(p)
  const { vgs, vds, vth } = p
  const kn = r.kn
  const L = []

  L.push(
    `VOV = VGS − VTH = ${f(vgs)} − ${f(vth)} = ${f(r.vov)} V`
  )

  if (r.eq === 'cutoff') {
    L.push(
      `VGS ≤ VTH → Cutoff region`,
      `ID = 0 mA`,
      `No inversion channel is formed.`
    )
  }

  else if (r.eq === 'triode') {
    L.push(
      `VDS (${f(vds)}) < VOV (${f(r.vov)}) → Triode region`,
      `ID = kn [VOV × VDS − VDS²/2]`,
      `ID = ${f(kn)} [${f(r.vov)} × ${f(vds)} − ${f(vds)}²/2]`,
      `ID = ${f(r.id, 3)} mA`
    )
  }

  else {
    L.push(
      `VDS (${f(vds)}) ≥ VOV (${f(r.vov)}) → Saturation with CLM`,
      `ID = (kn / 2) × VOV² × (1 + λVDS)`,
      `ID = (${f(kn)}/2) × ${f(r.vov)}² × (1 + ${f(p.lambda)} × ${f(vds)})`,
      `ID = ${f(r.id, 3)} mA`,
      `ro ≈ 1 / (λ × ID)`,
      `ro = ${f(r.ro, 3)} kΩ`
    )
  }

  return (
   <section className="panel calc-panel">
  <h3>UNDERSTAND THE CALCULATION</h3>
      {L.map((l, i) => (
        <pre key={i} className={i === L.length - 1 ? 'final' : ''}>
          {l}
        </pre>
      ))}
    </section>
  )
}



function Readings({ p }) {
  const r = compute(p)
  const c = REGION_COLOR[r.region]

  const rows = [
    ['VGS', f(p.vgs) + ' V'],
    ['VDS', f(p.vds) + ' V'],
    ['VTH', f(p.vth) + ' V'],
    ['VOV', f(r.vov) + ' V'],
    ['W', f(p.w) + ' µm'],
    ['L', f(p.l) + ' µm'],
    ['µn', f(p.mun) + ' cm²/V·s'],
    ['Cox', f(p.cox) + ' fF/µm²'],
    ['λ', f(p.lambda) + ' V⁻¹'],
    ['kn (calculated)', f(r.kn, 4) + ' mA/V²'],
    ['ID', f(r.id, 3) + ' mA'],
    [
      'Output resistance (ro)',
      r.region !== 'SATURATION'
        ? 'N/A outside saturation'
        : p.lambda > 0
          ? f(r.ro, 3) + ' kΩ'
          :  '∞ (λ = 0, no CLM)'
    ],
    [
      'Channel',
      r.channel
        ? (r.pinchoff ? 'Formed, pinched off at drain' : 'Formed, continuous')
        : 'No strong inversion'
    ],
    [
      'Saturation boundary',
      r.vov > 0
        ? `VDS = VOV = ${f(r.vov)} V`
        : 'n/a (VGS ≤ VTH)'
    ]
  ]

  return (
    <section className="panel">
      <h3>LIVE READINGS</h3>

      <div className="badge" style={{ background: c }}>
        {r.region}
      </div>

      <table>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="expl" style={{ borderColor: c }}>
        {EXPLAIN[r.region]}
      </p>
    </section>
  )
}


function Simulator({ p, set, playing, setPlaying }) {
  return (
    <div className="grid3">

      <section className="panel">
        <h3>ELECTRICAL INPUTS</h3>

        <Control label="VGS" unit="V" value={p.vgs} min={0} max={25} step={0.05} onChange={v => set({ vgs: v })} />
        <Control label="VDS" unit="V" value={p.vds} min={0} max={25} step={0.05} onChange={v => set({ vds: v })} />
        <Control label="VTH" unit="V" value={p.vth} min={0.2} max={10} step={0.05} onChange={v => set({ vth: v })} />

        <Control label="W (Width)" unit="µm" value={p.w} min={1} max={100} step={1} onChange={v => set({ w: v })} />
        <Control label="L (Length)" unit="µm" value={p.l} min={0.1} max={10} step={0.1} onChange={v => set({ l: v })} />
        <Control label="µn (Mobility)" unit="cm²/V·s" value={p.mun} min={50} max={1000} step={10} onChange={v => set({ mun: v })} />
        <Control label="Cox" unit="fF/µm²" value={p.cox} min={1} max={20} step={0.5} onChange={v => set({ cox: v })} />
        <Control label="λ (CLM)" unit="V⁻¹" value={p.lambda} min={0} max={0.2} step={0.005} onChange={v => set({ lambda: v })} />

        <div className="derived-kn">
  <div className="derived-kn-heading">CALCULATED kn</div>
  <div className="derived-kn-value">
    {p.kn.toFixed(4)}
    <span>mA/V²</span>
  </div>
  <div className="derived-kn-formula">
    kn = µn × Cox × (W/L) × 10⁻⁴
  </div>
</div>

        <div className="btns">
          {Object.entries(PRESETS).map(([k, v]) => (
            <button key={k} onClick={() => set(v)}>{k}</button>
          ))}
        </div>

        <div className="btns">
          <button onClick={() => set(DEFAULTS)}>Reset</button>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </section>

      <section className="panel wide">
        <h3>LIVE NMOS STRUCTURE</h3>
        <MosfetSVG {...p} playing={playing} />

        <p className="note">
          Channel shading = inversion charge density, not physical growth of the silicon.
          Educational long-channel square-law model with first-order channel-length
          modulation (CLM). Subthreshold conduction, body effect and short-channel
          effects are not included.
        </p>
      </section>

      <Readings p={p} />
      <Calc p={p} />

    </div>
  )
}

function Graphs({ p }) {
  const ref = useRef(), [mode, setMode] = useState('output'), [multi, setMulti] = useState([2, 3, 4, 5])
  const r = compute(p)
  const keys = [...new Set([...multi, +p.vgs.toFixed(2)])].sort((a, b) => a - b)
  const vov = Math.max(p.vgs - p.vth, 0)

const explanation =
  r.region === 'CUTOFF'
    ? 'The MOSFET is OFF. Since VGS is not greater than VTH, no strong inversion channel is formed and drain current is zero.'
    : r.region === 'TRIODE'
    ? 'The MOSFET operates in the triode region. A continuous channel is formed between source and drain. Drain current depends on both VDS and gate overdrive.'
    : 'The MOSFET operates in saturation. The channel is pinched off near the drain. Channel-length modulation causes drain current to increase slightly as VDS increases.'

const equation =
  r.region === 'CUTOFF'
    ? 'ID = 0'
    : r.region === 'TRIODE'
    ? 'ID = kn [VOV × VDS − VDS² / 2]'
    : 'ID = (kn / 2) × VOV² × (1 + λVDS)'
  let data, op, xl
  if (mode === 'output') {
    const cs = keys.map(v => outputCurve(v, p))
    data = cs[0].map((pt, i) => {
  const o = { x: pt.x }

  keys.forEach((v, j) => {
    o['VGS=' + v] = cs[j][i].y
  })

  return o
})
    op = { x: p.vds, y: r.id }; xl = 'VDS (V)'
  } else {
    data = transferCurve(p.vds, p).map(d => ({ x: d.x, ID: d.y })); op = { x: p.vgs, y: r.id }; xl = 'VGS (V)'
  }
  const palette = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fb923c', '#facc15']
  const csv = () => { const h = Object.keys(data[0]); const t = [h.join(','), ...data.map(d => h.map(k => d[k]).join(','))].join('\n'); dl(URL.createObjectURL(new Blob([t], { type: 'text/csv' })), `mosfet_${mode}.csv`) }
  const dl = (u, n) => { const a = document.createElement('a'); a.href = u; a.download = n; a.click() }
  const png = () => {
    const svg = ref.current.querySelector('svg'), b = svg.getBoundingClientRect(), c = document.createElement('canvas'); c.width = b.width * 2; c.height = b.height * 2
    const x = c.getContext('2d'), img = new Image(); img.onload = () => { x.fillStyle = '#0f172a'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); dl(c.toDataURL('image/png'), `mosfet_${mode}.png`) }
    const s = new XMLSerializer().serializeToString(svg).replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" style="color:#e2e8f0;font-family:sans-serif"`)
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)
  }
  const [k, setK] = useState(0)
  return <div className="grid2"><section className="panel"><h3>GRAPH LABORATORY</h3>
    <div className="btns"><button className={mode === 'output' ? 'on' : ''} onClick={() => setMode('output')}>Output (ID–VDS)</button><button className={mode === 'transfer' ? 'on' : ''} onClick={() => setMode('transfer')}>Transfer (ID–VGS)</button></div>
    <Control label="VGS" unit="V" value={p.vgs} min={0} max={25} step={0.05} onChange={v => p.set({ vgs: v })} />
    <Control label="VDS" unit="V" value={p.vds} min={0} max={25} step={0.05} onChange={v => p.set({ vds: v })} />
    <Control label="VTH" unit="V" value={p.vth} min={0.2} max={10} step={0.05} onChange={v => p.set({ vth: v })} />
   <Control label="W (Width)" unit="µm" value={p.w} min={1} max={100} step={1} onChange={v => p.set({ w: v })} />

<Control label="L (Length)" unit="µm" value={p.l} min={0.1} max={10} step={0.1} onChange={v => p.set({ l: v })} />

<Control label="µn (Mobility)" unit="cm²/V·s" value={p.mun} min={50} max={1000} step={10} onChange={v => p.set({ mun: v })} />

<Control label="Cox" unit="fF/µm²" value={p.cox} min={1} max={20} step={0.5} onChange={v => p.set({ cox: v })} />

<Control label="λ (CLM)" unit="V⁻¹" value={p.lambda} min={0} max={0.2} step={0.005} onChange={v => p.set({ lambda: v })} />

<div className="derived-kn">
  <strong>Calculated kn</strong>
  <span>{r.kn.toFixed(4)} mA/V²</span>
</div>
    {mode === 'output' && <div className="btns">{[1.5, 2, 3, 4, 5].map(v => <label key={v}><input type="checkbox" checked={multi.includes(v)} onChange={() => setMulti(m => m.includes(v) ? m.filter(x => x !== v) : [...m, v])} /> VGS={v}</label>)}</div>}
    <div className="btns"><button onClick={() => setK(k + 1)}>Reset zoom</button><button onClick={png}>Download PNG</button><button onClick={csv}>Export CSV</button></div>
    <p className="note">Zoom with the brush under the chart. Operating point: {f(op.x)} , {f(op.y, 3)} mA · {r.region}</p></section>
    <section className="panel" ref={ref}><ResponsiveContainer width="100%" height={420} key={k + mode}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}><CartesianGrid stroke="#1e293b" />
        <XAxis dataKey="x" type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#94a3b8" label={{ value: xl, position: 'insideBottom', offset: -12, fill: '#94a3b8' }} />
        <YAxis stroke="#94a3b8" allowDataOverflow domain={[0, 'auto']} label={{ value: 'ID (mA)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} formatter={v => f(v, 3)} labelFormatter={v => `${xl.split(' ')[0]} = ${v}`} /><Legend verticalAlign="top" />
        {mode === 'output' ? <>{keys.map((v, i) => <Line key={v} dataKey={'VGS=' + v} dot={false} isAnimationActive={false} stroke={palette[i % 6]} strokeWidth={Math.abs(v - p.vgs) < 0.01 ? 4 : 1.5} />)}
        
         {keys
  .filter(v => v > p.vth)
  .map((v, i) => {
    const vov = v - p.vth
    const idsat = compute({
  ...p,
  vgs: v,
  vds: vov
}).id

    return (
      <ReferenceDot
        key={`sat-${v}`}
        x={vov}
        y={idsat}
        r={6}
        fill="#fbbf24"
        stroke="#ffffff"
        strokeWidth={2}
        ifOverflow="hidden"
        label={{
          value: `Sat ${v}V`,
          position: 'top',
          fill: '#fbbf24',
          fontSize: 10
        }}
      />
    )
  })} </>
          : <><Line dataKey="ID" dot={false} isAnimationActive={false} stroke="#22d3ee" strokeWidth={2.5} /><ReferenceLine x={p.vth} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'VTH', fill: '#f59e0b' }} /></>}
        <ReferenceDot x={op.x} y={op.y} r={7} fill={REGION_COLOR[r.region]} stroke="#fff" />
        <Brush dataKey="x" height={18} stroke="#38bdf8" fill="#0f172a" /></LineChart></ResponsiveContainer>
<section className="panel" style={{ marginTop: 20 }}>
  <h3>LIVE GRAPH EXPLANATION</h3>

  <div className="badge" style={{
    background: REGION_COLOR[r.region],
    color: '#fff',
    padding: '8px 14px',
    display: 'inline-block',
    borderRadius: 8
  }}>
    {r.region}
  </div>

  <h2 style={{ color: '#22d3ee' }}>
    {f(r.id, 3)} mA
  </h2>
  <p>Calculated drain current (ID)</p>

  <hr />

  <h4>VOLTAGE ANALYSIS</h4>

  <p>Gate voltage (VGS): {f(p.vgs)} V</p>
  <p>Drain voltage (VDS): {f(p.vds)} V</p>
  <p>Threshold voltage (VTH): {f(p.vth)} V</p>
  <p>Overdrive voltage (VOV): {f(vov)} V</p>

  <hr />

  <h4>GOVERNING EQUATION</h4>

  <pre className="final">{equation}</pre>

  <p>
   kn = {f(r.kn, 4)} mA/V²
  </p>

  <hr />

  <h4>WHAT IS HAPPENING?</h4>

  <p className="expl"
    style={{
      borderLeft: '4px solid #22d3ee',
      padding: 12,
      lineHeight: 1.7
    }}>
    {explanation}
  </p>

  <h4>LEARNING TIP</h4>

  <p>
    {r.region === 'CUTOFF'
      ? 'Increase VGS above VTH to form an inversion channel and turn on the transistor.'
      : r.region === 'TRIODE'
      ? 'Increase VDS while observing how drain current changes until VDS reaches VOV.'
      : 'Change VGS to observe how saturation current changes with the square of the overdrive voltage.'}
  </p>
</section>
</section></div>
}


function Compare({ p0 }) {
  const [sync, setSync] = useState(false)

  const base = { ...DEFAULTS, ...(p0 || {}) }
  delete base.set

  const makeCases = () => ({
    CUTOFF: {
      ...base,
      vgs: 0.5,
      vds: 2
    },
    TRIODE: {
      ...base,
      vgs: 3,
      vds: 1
    },
    SATURATION: {
      ...base,
      vgs: 3,
      vds: 3
    }
  })

  const [m, setM] = useState(makeCases)

  const upd = (name, patch) => {
    setM(s =>
      sync
        ? Object.fromEntries(
            Object.entries(s).map(([k, v]) => [
              k,
              { ...v, ...patch }
            ])
          )
        : {
            ...s,
            [name]: { ...s[name], ...patch }
          }
    )
  }

  const eqs = {
    CUTOFF: 'ID = 0',
    TRIODE: 'ID = kn [VOV × VDS − VDS²/2]',
    SATURATION: 'ID = (kn/2) × VOV² × (1 + λVDS)'
  }

  return (
    <div>
      <div className="btns">
        <label>
          <input
            type="checkbox"
            checked={sync}
            onChange={e => setSync(e.target.checked)}
          />
          Synchronize parameters across all three
        </label>

        <button onClick={() => setM(makeCases())}>
          Reset
        </button>
      </div>

      <div className="grid3c">
        {Object.entries(m).map(([name, q]) => {
          const r = compute(q)

          return (
            <section className="panel" key={name}>
              <h3 style={{ color: REGION_COLOR[r.region] }}>
                {name} case → {r.region}
              </h3>

              <MosfetSVG {...q} compact />

              <Control label="VGS" unit="V" value={q.vgs}
                min={0} max={25} step={0.05}
                onChange={v => upd(name, { vgs: v })} />

              <Control label="VDS" unit="V" value={q.vds}
                min={0} max={25} step={0.05}
                onChange={v => upd(name, { vds: v })} />

              <Control label="VTH" unit="V" value={q.vth}
                min={0.2} max={10} step={0.05}
                onChange={v => upd(name, { vth: v })} />

              <Control label="W" unit="µm" value={q.w}
                min={1} max={100} step={1}
                onChange={v => upd(name, { w: v })} />

              <Control label="L" unit="µm" value={q.l}
                min={0.1} max={10} step={0.1}
                onChange={v => upd(name, { l: v })} />

              <Control label="µn" unit="cm²/V·s" value={q.mun}
                min={50} max={1000} step={10}
                onChange={v => upd(name, { mun: v })} />

              <Control label="Cox" unit="fF/µm²" value={q.cox}
                min={1} max={20} step={0.5}
                onChange={v => upd(name, { cox: v })} />

              <Control label="λ (CLM)" unit="V⁻¹" value={q.lambda}
                min={0} max={0.2} step={0.005}
                onChange={v => upd(name, { lambda: v })} />

              <pre>kn = {f(r.kn, 4)} mA/V²</pre>
              <pre>{eqs[r.region]}</pre>

              <pre className="final">
                VOV = {f(r.vov)} V
                {'\n'}ID = {f(r.id, 3)} mA
                {r.region === 'SATURATION'
                  ? `\nro = ${f(r.ro, 3)} kΩ`
                  : ''}
              </pre>

              <p className="expl"
                style={{ borderColor: REGION_COLOR[r.region] }}>
                {EXPLAIN[r.region]}
              </p>
            </section>
          )
        })}
      </div>
    </div>
  )
}

const TABS = ['Dashboard', 'Live Simulator', 'Graph Laboratory', 'Compare Modes', 'Guided Experiments', 'Learn MOSFET', 'Quiz and Practice']
export default function App() {
  const [tab, setTab] = useState(0), [s, setS] = useState(DEFAULTS), [playing, setPlaying] = useState(true)
const set = patch => setS(o => ({ ...o, ...patch }))
const p = { ...s, kn: compute(s).kn, set }
  const tryIt = v => { set({ ...DEFAULTS, ...v }); setTab(1) }
  return <div className="app"><header><h1>MOSFET <span>LAB</span></h1><nav>{TABS.map((t, i) => <button key={t} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}</nav></header>
   <main className="learning-page">
  {tab === 0 && <Dashboard s={s} go={setTab} />}
 {tab === 1 && <Simulator p={p} set={set} playing={playing} setPlaying={setPlaying} />}
  {tab === 2 && <Graphs p={p} />}
  {tab === 3 && <Compare p0={p} />}
  {tab === 4 && <Experiments />}
  {tab === 5 && <Learn tryIt={tryIt} />}
  {tab === 6 && <Quiz />}
</main>
</div>
}
