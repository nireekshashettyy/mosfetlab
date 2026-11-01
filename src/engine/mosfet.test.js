import { compute } from './mosfet.js'
import assert from 'node:assert'
const T = [[0,0,1,2,'CUTOFF',0],[3,0,1,2,'TRIODE',0],[3,1,1,2,'TRIODE',3],[3,2,1,2,'SATURATION',4],[3,4,1,2,'SATURATION',4],[1,3,1,2,'CUTOFF',0]]
T.forEach(([vgs,vds,vth,kn,reg,id],i)=>{const r=compute({vgs,vds,vth,kn});assert.equal(r.region,reg);assert(Math.abs(r.id-id)<1e-9,`T${i+1}`);console.log(`TEST ${i+1} ok: ${r.region} ID=${r.id}`)})
const a=compute({vgs:3,vds:2-1e-9,vth:1,kn:2}).id,b=compute({vgs:3,vds:2,vth:1,kn:2}).id
assert(Math.abs(a-b)<1e-6);console.log('Continuity at boundary ok')
import { makeQuestion } from '../quiz.js'
const ref = m => { const v = m.vgs - m.vth; return v <= 0 ? 0 : m.vds < v ? m.kn * (v * m.vds - m.vds ** 2 / 2) : m.kn / 2 * v * v }
let n = 0
for (let i = 0; i < 1000; i++) for (const L of ['beginner', 'intermediate']) {
  const q = makeQuestion(L); assert(q.ans >= 0 && q.opts.length >= 2 && new Set(q.opts).size === q.opts.length, 'bad options')
  if (q.meta?.id !== undefined) { assert(Math.abs(parseFloat(q.opts[q.ans]) - ref(q.meta)) < 0.006, 'numeric ' + q.q); n++ }
  if (q.meta?.region) { const v = q.meta.vgs - q.meta.vth; assert.equal(q.opts[q.ans], v <= 0 ? 'CUTOFF' : q.meta.vds < v ? 'TRIODE' : 'SATURATION'); n++ }
}
console.log(`Quiz: ${n} generated answers verified independently`)
