<script>
  import { statusOf, COLORS, RANGE } from '$lib/data.js';

  export let label = '';
  export let signal = 'ec';           // ph | ec | temp | level
  export let series = [];             // number[]
  export let lo = 0;
  export let hi = 0;

  $: range = RANGE[signal];
  $: yFor = (v) => 100 - Math.max(0, Math.min(1, (v - range.dmin) / (range.dmax - range.dmin))) * 100;
  $: n = series.length;
  $: points = series.map((v, i) => `${((n <= 1 ? 0 : i / (n - 1)) * 100).toFixed(1)},${yFor(v).toFixed(1)}`).join(' ');
  $: last = series.length ? series[series.length - 1] : range.dmin;
  $: statusKey = statusOf(signal, last, lo, hi);
  $: c = COLORS[statusKey];
  $: hiY = yFor(hi);
  $: loY = yFor(lo);
  $: fmtBound = (v) => (signal === 'temp' || signal === 'level' ? v.toFixed(0) : v.toFixed(1));
</script>

<div class="chart">
  <div class="head">
    <div class="meta">
      <span class="title">{label}</span>
      <span class="band">Safe band {fmtBound(lo)}–{fmtBound(hi)} {range.unit}</span>
    </div>
    <span class="now" style="color:{c.txt}">{last.toFixed(range.dec)}</span>
  </div>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect x="0" y={hiY.toFixed(1)} width="100" height={(loY - hiY).toFixed(1)} fill={c.soft} opacity="0.6" />
    <line x1="0" y1={hiY.toFixed(1)} x2="100" y2={hiY.toFixed(1)} stroke="#D7CDB6" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
    <line x1="0" y1={loY.toFixed(1)} x2="100" y2={loY.toFixed(1)} stroke="#D7CDB6" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
    <polyline {points} fill="none" stroke={c.ring} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
  </svg>
</div>

<style>
  .chart {
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius);
    padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3);
  }
  .head { display: flex; align-items: flex-start; justify-content: space-between; }
  .meta { display: flex; flex-direction: column; gap: 3px; }
  .title { font-size: var(--text-sm); letter-spacing: .04em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .band { font-size: var(--text-xs); color: #B6A98E; }
  .now { font-family: var(--mono); font-size: var(--text-lg); font-weight: 700; }
  svg { width: 100%; height: 120px; }
</style>
