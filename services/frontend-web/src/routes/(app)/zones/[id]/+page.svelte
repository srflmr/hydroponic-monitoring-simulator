<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { farm } from '$lib/sim.js';
  import { metric, zoneStatus, RANGE } from '$lib/data.js';
  import { postSimulate } from '$lib/api-client.js';
  import Ring from '$lib/components/Ring.svelte';
  import Chart from '$lib/components/Chart.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import ArbitrationLog from '$lib/components/ArbitrationLog.svelte';

  export let data;

  $: id = $page.params.id;
  $: zones = $farm.zones;
  $: zone = zones.find((z) => z.id === id);
  $: status = zone ? zoneStatus(zone) : null;

  $: rings = zone ? [
    { ...metric('ph', zone.ph, zone.th.phMin, zone.th.phMax), label: 'pH' },
    { ...metric('ec', zone.ec, zone.th.ecMin, zone.th.ecMax), label: 'EC' },
    { ...metric('temp', zone.temp, zone.th.tempMin, zone.th.tempMax), label: 'Temp' },
    { ...metric('level', zone.level, 80, 100), label: 'Water' }
  ] : [];

  $: hist = data.history;
  $: charts = zone ? [
    { signal: 'ec', label: 'EC', series: hist.ec, lo: zone.th.ecMin, hi: zone.th.ecMax },
    { signal: 'ph', label: 'pH', series: hist.ph, lo: zone.th.phMin, hi: zone.th.phMax },
    { signal: 'temp', label: 'Water temp', series: hist.temp, lo: zone.th.tempMin, hi: zone.th.tempMax },
    { signal: 'level', label: 'Water level', series: hist.level, lo: 80, hi: 100 }
  ] : [];

  $: thresholdRows = zone ? [
    { label: 'pH', range: `${zone.th.phMin.toFixed(1)} – ${zone.th.phMax.toFixed(1)}` },
    { label: 'EC (mS/cm)', range: `${zone.th.ecMin.toFixed(1)} – ${zone.th.ecMax.toFixed(1)}` },
    { label: 'Water temp (°C)', range: `${zone.th.tempMin.toFixed(0)} – ${zone.th.tempMax.toFixed(0)}` },
    { label: 'Water level (%)', range: '80 – 100' }
  ] : [];

  $: zoneLogs = zone ? $farm.logs.filter((l) => l.zone_id === zone.id).slice(0, 6) : [];

  let simParam = 'ec';
  let simValue = 0.5;
  let simDuration = 30;
  let simMsg = '';
  async function triggerSim(zoneId) {
    simMsg = '';
    try {
      await postSimulate(zoneId, simParam, Number(simValue), Number(simDuration));
      simMsg = 'Simulation triggered';
    } catch (e) {
      simMsg = 'Could not trigger simulation';
    }
  }

  async function triggerEcCritical(zoneId) {
    if (!zone) return;
    simMsg = '';
    try {
      await postSimulate(zoneId, 'ec', zone.th.ecMin * 0.5, 60);
      simMsg = 'EC critical preset triggered (60 s)';
    } catch (e) {
      simMsg = 'Could not trigger EC critical preset';
    }
  }

  async function triggerEcNormal(zoneId) {
    if (!zone) return;
    simMsg = '';
    try {
      const mid = (zone.th.ecMin + zone.th.ecMax) / 2;
      await postSimulate(zoneId, 'ec', mid, 5);
      simMsg = 'EC normal preset triggered (5 s)';
    } catch (e) {
      simMsg = 'Could not trigger EC normal preset';
    }
  }
</script>

<svelte:head><title>{zone ? zone.crop : 'Zone'} · HMS</title></svelte:head>

<section class="page">
  <div class="controls">
    <div class="left">
      <button class="ghost" on:click={() => goto('/dashboard')}>← Overview</button>
      <div class="tabs">
        {#each zones as z (z.id)}
          <button class="tab" class:active={z.id === zone?.id} on:click={() => goto('/zones/' + z.id)}>{z.crop}</button>
        {/each}
      </div>
    </div>
    <button class="edit" on:click={() => goto('/config')}>Edit thresholds</button>
  </div>

  {#if zone}
  <div class="zhead">
    <div class="title">
      <span class="crop">{zone.crop}</span>
      <span class="sub">{zone.name} · Priority {zone.priority}</span>
    </div>
    <div class="zrings">
      {#each rings as r}
        <Ring label={r.label} value={r.value} pct={r.pct} ring={r.ring} soft={r.soft} size={76} />
      {/each}
      <StatusPill txt={status.txt} soft={status.soft} dot={status.dot} label={status.label} />
    </div>
  </div>

  <div class="detail">
    <div class="charts">
      {#each charts as c}
        <Chart signal={c.signal} label={c.label} series={c.series} lo={c.lo} hi={c.hi} />
      {/each}
    </div>

    <div class="side">
      <div class="panel">
        <span class="cap">Thresholds</span>
        {#each thresholdRows as r}
          <div class="trow">
            <span class="tlabel">{r.label}</span>
            <span class="trange">{r.range}</span>
          </div>
        {/each}
      </div>

      <div class="panel grow">
        <div class="phead">
          <span class="cap">Recent decisions</span>
          <span class="live"></span>
        </div>
        {#if zoneLogs.length === 0}
          <span class="empty">No arbitration events for this zone yet.</span>
        {:else}
          <ArbitrationLog logs={zoneLogs} variant="stack" title="Recent decisions" />
        {/if}
      </div>
    </div>
  </div>
  {:else}
  <div class="notfound">Zone "{id}" not found.</div>
  {/if}

  {#if zone}
  <section class="simulate">
    <h3>Trigger simulation</h3>
    <div class="sim-presets">
      <button class="preset crit" on:click={() => triggerEcCritical(id)}>EC critical (60 s)</button>
      <button class="preset ok" on:click={() => triggerEcNormal(id)}>EC normal (5 s)</button>
    </div>
    <div class="sim-form">
      <select bind:value={simParam} aria-label="Parameter">
        <option value="ph">ph</option>
        <option value="ec">ec</option>
        <option value="water_temp_c">water_temp_c</option>
        <option value="water_level_pct">water_level_pct</option>
      </select>
      <input type="number" step="0.1" bind:value={simValue} aria-label="Value" />
      <input type="number" bind:value={simDuration} aria-label="Duration (s)" />
      <button on:click={() => triggerSim(id)}>Trigger</button>
    </div>
    {#if simMsg}<p class="sim-msg">{simMsg}</p>{/if}
  </section>
  {/if}
</section>

<style>
  .page { padding: 24px clamp(16px, 4vw, 32px) 40px; display: flex; flex-direction: column; gap: 22px; }

  .controls { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .left { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .ghost { border: 1px solid #E2D8C0; background: var(--surface); cursor: pointer; padding: 9px 14px; border-radius: var(--radius-xs); font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--ink-3); }
  .ghost:hover { background: #F1EADB; }
  .tabs { display: flex; gap: 7px; flex-wrap: wrap; }
  .tab { border: 1px solid #E5DBC4; cursor: pointer; padding: 9px 15px; border-radius: var(--radius-xs); font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--ink-2); background: var(--surface); }
  .tab.active { color: var(--header); background: var(--nutrient); border-color: var(--nutrient); }
  .edit { border: none; cursor: pointer; padding: 10px 16px; border-radius: var(--radius-xs); background: var(--accent-soft); color: var(--ok); font-family: var(--font); font-size: 14px; font-weight: 700; }
  .edit:hover { background: #D6E2C0; }

  .zhead {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
    background: var(--surface); border: 1px solid var(--hair); border-radius: 20px; padding: 22px 26px;
  }
  .title { display: flex; flex-direction: column; gap: 4px; }
  .crop { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
  .sub { font-size: 14px; color: var(--muted); }
  .zrings { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }

  .detail { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .side { display: flex; flex-direction: column; gap: 18px; }
  .panel { background: var(--surface); border: 1px solid var(--hair); border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
  .panel.grow { flex: 1; }
  .cap { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .phead { display: flex; align-items: center; gap: 9px; }
  .live { width: 7px; height: 7px; border-radius: 50%; background: var(--ok-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .trow { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--hair-2); }
  .tlabel { font-size: 14px; color: var(--ink-2); font-weight: 500; }
  .trange { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--ink); }
  .empty { font-size: 13px; color: #B6A98E; padding: 8px 0; }

  .notfound { padding: 28px; color: var(--muted); font-size: 15px; }

  /* Strip ArbitrationLog card chrome when embedded inside the panel. */
  .panel.grow :global(.log) { background: transparent; border: none; border-radius: 0; padding: 0; }

  @media (max-width: 1180px) { .detail { grid-template-columns: 1fr; } }
  @media (max-width: 900px)  { .zhead { flex-direction: column; align-items: flex-start; } }
  @media (max-width: 620px)  { .charts { grid-template-columns: 1fr; } }

  .simulate { margin-top: 24px; }
  .simulate h3 { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: var(--ink); }
  .sim-presets { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .preset { border: none; cursor: pointer; padding: 9px 16px; border-radius: var(--radius-sm, 8px); font-family: var(--font, inherit); font-size: 14px; font-weight: 700; }
  .preset.crit { background: var(--crit-ring, #c0392b); color: #fff; }
  .preset.crit:hover { filter: brightness(1.1); }
  .preset.ok { background: var(--accent-soft, #e0f0d0); color: var(--ok, #4b8f3f); }
  .preset.ok:hover { background: #D6E2C0; }
  .sim-form { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .sim-form select, .sim-form input { padding: 8px 10px; border-radius: var(--radius-sm, 8px); border: 1px solid var(--line, #d8d2c0); font-family: var(--font, inherit); }
  .sim-form input { width: 110px; }
  .sim-form button { padding: 9px 16px; border: none; border-radius: var(--radius-sm, 8px); background: var(--nutrient, #4b8f3f); color: var(--header, #fff); font-weight: 700; cursor: pointer; }
  .sim-msg { font-size: 13px; color: var(--ink-3, #6b6b6b); margin-top: 8px; }
</style>
