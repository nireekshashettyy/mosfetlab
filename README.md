# MOSFET LAB
Interactive enhancement-mode NMOS virtual lab. React + Vite + Recharts + SVG.

## Run
    npm install
    npm run dev      # open the printed URL
    npm test         # engine validation (6 spec cases + triode/saturation continuity)

## Architecture
- `src/engine/mosfet.js` – pure calculation engine (no UI). Ideal square-law model; units V, mA, mA/V². Replace or extend it (channel-length modulation, subthreshold, body effect, PMOS) without touching components.
- `src/components/MosfetSVG.jsx` – cross-section driven only by `compute()`. Channel shading = inversion charge density; tapers toward drain in triode, pinches near drain in saturation but never vanishes; electrons move S→D inside the channel only, speed/density ∝ ID; conventional current D→S.
- `src/App.jsx` – Simulator, Graph Laboratory, Compare Modes, navigation. `src/Stage2.jsx` – Dashboard, Guided Experiments, Learn MOSFET, Quiz. `src/quiz.js` – question generators (answers computed by the engine and re-verified independently in `npm test`).

## Assumptions
Neglects subthreshold conduction, channel-length modulation, body effect and short-channel effects.

## Status
None. All seven sections are implemented.
