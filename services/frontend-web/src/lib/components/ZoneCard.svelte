<script>
  import Ring from './Ring.svelte';
  import StatusPill from './StatusPill.svelte';
  import Glossary from './Glossary.svelte';
  import { metric, zoneStatus } from '$lib/data.js';
  import { farm } from '$lib/sim.js';

  export let zone;
  export let flow = false;            // currently drawing nutrient
  export let queued = false;

  $: ph = metric('ph', zone.ph, zone.th.phMin, zone.th.phMax);
  $: ec = metric('ec', zone.ec, zone.th.ecMin, zone.th.ecMax);
  $: temp = metric('temp', zone.temp, zone.th.tempMin, zone.th.tempMax);
  $: level = metric('level', zone.level, 80, 100);
  $: status = zoneStatus(zone);
  $: flowState = flow ? 'receiving' : queued ? 'queued' : 'idle';
  $: flowLabel = flow ? 'Receiving nutrient' : queued ? 'Queued' : 'Idle';
  $: actuated = !!($farm.actuated && $farm.actuated[zone.id]);
</script>

<a class="card" href="/zones/{zone.id}">
  <div class="top">
    <div class="title">
      <span class="crop">{zone.name}</span>
      <span class="sub">
        Growing: {zone.crop} ·
        <Glossary term="Priority" definition="Operator-assigned weight (1-10) used in the arbitration score — higher priority zones are served first when multiple zones compete for the shared tank.">Priority</Glossary>
        {zone.priority}
      </span>
    </div>
    <StatusPill txt={status.txt} soft={status.soft} dot={status.dot} label={status.label} />
  </div>

  <div class="ring-labels">
    <Glossary term="pH" definition="Acidity of the nutrient solution (0-14 scale). Advisory only in this system — never triggers a critical alert.">pH</Glossary>
    <Glossary term="EC" definition="Electrical Conductivity (mS/cm) — a proxy for dissolved nutrient concentration in the solution. This is the ONLY signal that drives critical status and nutrient arbitration in this system.">EC</Glossary>
    <Glossary term="Temp" definition="Water temperature (°C). Advisory only — never triggers a critical alert.">Temp</Glossary>
  </div>
  <div class="rings">
    <Ring label=""   value={ph.value}   pct={ph.pct}   ring={ph.ring}   soft={ph.soft} />
    <Ring label=""   value={ec.value}   pct={ec.pct}   ring={ec.ring}   soft={ec.soft} />
    <Ring label=""   value={temp.value} pct={temp.pct} ring={temp.ring} soft={temp.soft} />
  </div>

  <div class="level">
    <div class="level-head">
      <span class="cap">Water level</span>
      <span class="pct" style="color:{level.txt}">{level.value}%</span>
    </div>
    <div class="track"><div class="fill" style="width:{level.value}%; background:{level.ring}"></div></div>
  </div>

  <div class="foot">
    <div class="flow">
      <span class="fdot fdot--{flowState}"></span>
      <span class="fcap">Flow:</span>
      <span class="flabel flabel--{flowState}">{flowLabel}</span>
    </div>
    <div class="foot-right">
      {#if actuated}<span class="actuated" title="Valve actuated">✓ actuated</span>{/if}
      <span class="more">View detail →</span>
    </div>
  </div>
</a>

<style>
  .card {
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius);
    padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4);
    text-decoration: none; color: inherit; cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px -20px rgba(60,48,30,.4); }
  .top { display: flex; align-items: flex-start; justify-content: space-between; }
  .title { display: flex; flex-direction: column; gap: var(--space-1); }
  .crop { font-size: var(--text-lg); font-weight: 700; letter-spacing: -.01em; }
  .sub { font-size: var(--text-xs); color: var(--muted); }
  .rings { display: flex; justify-content: space-between; padding: var(--space-1) var(--space-2); }
  .ring-labels { display: flex; justify-content: space-between; padding: 0 var(--space-2); }
  .ring-labels :global(.glossary) { font-size: var(--text-2xs); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .level { display: flex; flex-direction: column; gap: var(--space-2); }
  .level-head { display: flex; align-items: baseline; justify-content: space-between; }
  .cap { font-size: var(--text-xs); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .pct { font-family: var(--mono); font-size: var(--text-base); font-weight: 600; }
  .track { position: relative; height: 10px; border-radius: 6px; background: var(--bg); overflow: hidden; }
  .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; }
  .foot { display: flex; align-items: center; justify-content: space-between; padding-top: var(--space-1); border-top: 1px solid var(--hair-2); }
  .flow { display: flex; align-items: center; gap: var(--space-2); }
  .fdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .fdot--idle     { background: var(--muted); opacity: .45; }
  .fdot--queued   { background: var(--warn-ring); opacity: .8; }
  .fdot--receiving { background: var(--nutrient, #4A7C59); opacity: 1; }
  .fcap { font-size: var(--text-2xs); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .flabel { font-size: var(--text-sm); font-weight: 500; }
  .flabel--idle     { color: var(--muted); }
  .flabel--queued   { color: var(--warn); }
  .flabel--receiving { color: var(--nutrient, #4A7C59); font-weight: 600; }
  .more { font-size: var(--text-sm); font-weight: 600; color: var(--nutrient); }
  .foot-right { display: flex; align-items: center; gap: var(--space-2); }
  .actuated { font-size: var(--text-2xs); font-weight: 700; color: var(--nutrient-strong, #2F7D32); font-family: var(--mono, monospace); }
</style>
