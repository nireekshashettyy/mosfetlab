import React, { useState } from 'react'
const f = (x, d = 2) => (+x.toFixed(d)).toString()
export default function Control({ label, unit, value, min, max, step, onChange }) {
  const [txt, setTxt] = useState(null)
  const commit = v => { const n = parseFloat(v); if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n))); setTxt(null) }
  return <div className="ctl"><div className="row"><b>{label}</b><span><input type="number" step={step} value={txt ?? f(value)} onChange={e => setTxt(e.target.value)} onBlur={e => commit(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit(e.target.value)} /> {unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} /></div>
}
