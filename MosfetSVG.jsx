import React, { useEffect, useRef, useState } from 'react'
import { compute, REGION_COLOR } from '../engine/mosfet.js'

export default function MosfetSVG({ vgs, vds, vth, kn, playing = true, compact = false }) {
  const r = compute({ vgs, vds, vth, kn })
  const col = REGION_COLOR[r.region]
  // channel thickness = inversion charge density (not physical growth of silicon)
  const t = r.channel ? 4 + 16 * Math.min(r.vov / 4, 1) : 0
  const td = r.channel ? Math.max(0.15 * t, t * (r.vov - vds) / r.vov) : 0 // never vanishes
  const xp = r.pinchoff ? 430 - Math.min(35, (vds - r.vov) * 12) : 430
  const n = r.id > 0 ? Math.min(14, 2 + Math.round(r.id * 1.2)) : 0
  const [phase, setPhase] = useState(0)
  const spd = useRef(0); spd.current = r.id > 0 ? 0.08 + Math.min(r.id, 12) * 0.05 : 0
  useEffect(() => {
    if (!playing) return
    let raf, last = performance.now()
    const tick = now => { const dt = (now - last) / 1000; last = now; setPhase(p => (p + dt * spd.current) % 1); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [playing])
  const ey = 200 + (t + td) / 4 + 2
  const electrons = Array.from({ length: n }, (_, i) => { const f = (phase + i / n) % 1; return 120 + f * 400 })
  const ch = r.channel ? `210,200 ${xp},200 ${430},${200 + td} 210,${200 + t}` : ''
  return (
    <svg viewBox="0 0 640 400" className="mos" role="img" aria-label={`NMOS ${r.region}`}>
      <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#e2e8f0"/></marker>
        <marker id="ae" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#38bdf8"/></marker></defs>
      <rect x="20" y="200" width="600" height="130" fill="#7c4a3a" opacity=".55"/>
      <text x="320" y="300" textAnchor="middle" fill="#fbd5c8" fontSize="14">P-type substrate</text>
      <rect x="70" y="200" width="140" height="55" fill="#2563eb"/><text x="140" y="232" textAnchor="middle" fill="#fff" fontSize="13">N+ Source</text>
      <rect x="430" y="200" width="140" height="55" fill="#2563eb"/><text x="500" y="232" textAnchor="middle" fill="#fff" fontSize="13">N+ Drain</text>
      <rect x="205" y="178" width="230" height="22" fill="#cbd5e1" opacity=".85"/><text x="320" y="194" textAnchor="middle" fill="#0f172a" fontSize="12">SiO₂ oxide</text>
      <rect x="205" y="140" width="230" height="38" fill="#94a3b8"/><text x="320" y="164" textAnchor="middle" fill="#0f172a" fontSize="13">Gate</text>
      {r.channel && <polygon points={ch} fill="#22d3ee" opacity={0.35 + 0.6 * Math.min(r.vov / 4, 1)}/>}
      {r.pinchoff && <g><ellipse cx={xp} cy="212" rx="14" ry="12" fill="none" stroke="#f59e0b" strokeDasharray="3 3"/><text x={xp} y="270" textAnchor="middle" fill="#f59e0b" fontSize="11">pinch-off / high-field region</text></g>}
      {r.id === 0 && <text x="320" y="228" textAnchor="middle" fill="#94a3b8" fontSize="12">{r.channel ? 'channel formed, VDS = 0: no drift' : 'no strong inversion'}</text>}
      {electrons.map((x, i) => <circle key={i} cx={x} cy={x > 210 && x < 430 ? ey : 226} r="3.2" fill="#38bdf8"/>)}
      {[[140,'S'],[500,'D'],[320,'G']].map(([x,l]) => <g key={l}><line x1={x} y1={l==='G'?140:200} x2={x} y2="80" stroke="#e2e8f0" strokeWidth="2"/><circle cx={x} cy="80" r="5" fill="#e2e8f0"/><text x={x} y="68" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="600">{l}</text></g>)}
      <line x1="320" y1="330" x2="320" y2="350" stroke="#e2e8f0" strokeWidth="2"/><text x="335" y="348" fill="#e2e8f0" fontSize="12">B (body = source)</text>
      <text x="320" y="40" textAnchor="middle" fill="#94a3b8" fontSize="12">VGS = {vgs.toFixed(2)} V   VDS = {vds.toFixed(2)} V   VTH = {vth.toFixed(2)} V</text>
      {!compact && <g fontSize="11">
        <line x1="470" y1="370" x2="170" y2="370" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#ar)"/><text x="470" y="388" textAnchor="end" fill="#e2e8f0">conventional current ID (D → S)</text>
        <line x1="170" y1="384" x2="470" y2="384" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ae)" opacity="0"/>
        <text x="20" y="388" fill="#38bdf8">● electrons: S → D, in channel only</text></g>}
      <text x="600" y="130" textAnchor="end" fill={col} fontSize="13" fontWeight="700">{r.region} · ID = {r.id.toFixed(2)} mA</text>
    </svg>)
}
