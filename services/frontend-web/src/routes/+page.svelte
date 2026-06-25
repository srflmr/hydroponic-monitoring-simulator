<script>
  import { onMount, onDestroy } from 'svelte';
  import { connectSocket } from '$lib/socket';

  export let data;
  export let form;

  let zones = data.zones ?? [];
  let tank = data.tank ?? {};
  let logs = [];
  let connected = false;
  let flash = {};
  let socket;
  let alert = null;

  function num(value) {
    return value === null || value === undefined || value === '' ? null : Number(value);
  }

  function isCritical(zone) {
    const ec = num(zone.last_reading?.ec);
    const ecMin = num(zone.ec_min);
    return ec !== null && ecMin !== null && ec < ecMin;
  }

  function pulse(zoneId) {
    flash = { ...flash, [zoneId]: true };
    setTimeout(() => {
      const next = { ...flash };
      delete next[zoneId];
      flash = next;
    }, 700);
  }

  function applyReading(reading) {
    zones = zones.map((zone) =>
      zone.zone_id === reading.zone_id ? { ...zone, last_reading: reading } : zone,
    );
    pulse(reading.zone_id);
  }

  onMount(() => {
    socket = connectSocket();
    socket.on('connect', () => (connected = true));
    socket.on('disconnect', () => (connected = false));
    socket.on('zone:update', (reading) => applyReading(reading));
    socket.on('tank:update', (update) => (tank = { ...tank, ...update }));
    socket.on('arbitration:log', (log) => (logs = [{ ...log, _id: log.id ?? `${Date.now()}` }, ...logs].slice(0, 24)));
    socket.on('alert', (a) => {
      alert = a;
      setTimeout(() => { if (alert === a) alert = null; }, 8000);
    });
  });

  onDestroy(() => socket && socket.close());

  $: capacity = num(tank.capacity) ?? 0;
  $: volume = num(tank.current_volume) ?? 0;
  $: tankPct = capacity > 0 ? Math.min(100, Math.round((volume / capacity) * 1000) / 10) : 0;
  $: tankLow = capacity > 0 && tankPct <= 15;
  $: criticalCount = zones.filter(isCritical).length;
</script>

<div class="shell">
  <header class="bar">
    <div class="brand">
      <span class="eyebrow">Nutrient arbitration</span>
      <h1>Hydroponic Control</h1>
    </div>
    <div class="bar-right">
      <span class="status" class:on={connected}>
        <span class="dot"></span>{connected ? 'Live' : 'Connecting'}
      </span>
      <span class="op">operator</span>
      <form method="POST" action="?/simulate">
        <input type="hidden" name="zone_id" value="zone-a" />
        <button type="submit" class="trigger">Trigger low EC — Zone A</button>
      </form>
    </div>
  </header>

  {#if form?.triggered}
    <p class="toast ok" role="status">Triggered. Watch Zone A draw from the reservoir.</p>
  {:else if form?.error}
    <p class="toast err" role="status">Couldn't reach the simulator. Try again.</p>
  {/if}

  {#if alert}
    <p class="toast alert {alert.severity}" role="alert">
      <strong>{alert.zone_id}</strong> — {alert.message}
      <button class="dismiss" on:click={() => (alert = null)} aria-label="Tutup">×</button>
    </p>
  {/if}

  <div class="grid">
    <aside class="reservoir" class:low={tankLow}>
      <span class="eyebrow">Central reservoir</span>
      <div class="vessel" role="img" aria-label="Tank {tankPct}% full">
        <div class="liquid" style="height: {tankPct}%">
          <span class="waterline"></span>
        </div>
        <div class="ticks"><i></i><i></i><i></i></div>
      </div>
      <div class="readout">
        <span class="big">{volume.toFixed(1)}<span class="unit"> L</span></span>
        <span class="sub">of {capacity.toFixed(0)} L · <strong>{tankPct}%</strong> remaining</span>
      </div>
      {#if tankLow}<p class="warn">Reservoir low — refill needed.</p>{/if}
    </aside>

    <main class="content">
      <section class="zones" aria-label="Zones">
        <div class="section-head">
          <h2>Zones</h2>
          <span class="meta">{criticalCount} drawing nutrient</span>
        </div>
        <div class="zone-grid">
          {#each zones as zone (zone.zone_id)}
            {@const critical = isCritical(zone)}
            <article class="card" class:critical class:flash={flash[zone.zone_id]}>
              <div class="card-top">
                <h3>{zone.name ?? zone.zone_id}</h3>
                <span class="tag" class:critical>{critical ? 'EC low' : 'Nominal'}</span>
              </div>
              <dl class="readings">
                <div><dt>pH</dt><dd>{zone.last_reading?.ph ?? '—'}</dd></div>
                <div class:hot={critical}><dt>EC</dt><dd>{zone.last_reading?.ec ?? '—'}</dd></div>
                <div><dt>Temp</dt><dd>{zone.last_reading?.water_temp_c ?? '—'}<span class="u">°C</span></dd></div>
                <div><dt>Level</dt><dd>{zone.last_reading?.water_level_pct ?? '—'}<span class="u">%</span></dd></div>
              </dl>
              <span class="zone-id">{zone.zone_id}</span>
            </article>
          {/each}
        </div>
      </section>

      <section class="feed" aria-label="Arbitration decisions" aria-live="polite">
        <div class="section-head">
          <h2>Arbitration feed</h2>
          <span class="meta">contested allocations</span>
        </div>
        {#if logs.length === 0}
          <p class="empty">No allocation decisions yet. Trigger a low reading to watch arbitration run.</p>
        {:else}
          <ul class="feed-list">
            {#each logs as log (log._id)}
              <li class="decision {log.decision}">
                <span class="d-zone">{log.zone_id}</span>
                <span class="d-verb">{log.decision}</span>
                <span class="d-reason">{log.reason}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </main>
  </div>
</div>

<style>
  .shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: clamp(1.25rem, 3vw, 2.5rem);
  }

  .bar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding-bottom: 1.25rem;
    border-bottom: var(--hair);
  }
  .brand h1 {
    font-size: clamp(1.6rem, 3.4vw, 2.3rem);
    margin-top: 0.15rem;
  }
  .bar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .status {
    font-family: var(--mono);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .status .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted);
  }
  .status.on {
    color: var(--water);
  }
  .status.on .dot {
    background: var(--water);
    box-shadow: 0 0 0 0 rgba(94, 200, 214, 0.7);
    animation: ping 1.8s ease-out infinite;
  }
  @keyframes ping {
    0% { box-shadow: 0 0 0 0 rgba(94, 200, 214, 0.5); }
    70%, 100% { box-shadow: 0 0 0 7px rgba(94, 200, 214, 0); }
  }
  .op {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    padding: 0.3rem 0.6rem;
    border: var(--hair);
    border-radius: 999px;
  }
  .trigger {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--nutrient);
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background 0.18s, color 0.18s;
  }
  .trigger:hover {
    background: var(--nutrient);
    color: var(--ink);
  }

  .toast {
    margin: 1rem 0 0;
    padding: 0.6rem 0.9rem;
    border-radius: var(--radius);
    font-size: 0.9rem;
    border: var(--hair);
  }
  .toast.ok { color: var(--nutrient); border-color: rgba(69, 200, 154, 0.4); }
  .toast.err { color: var(--alert); border-color: rgba(239, 122, 82, 0.4); }
  .toast.alert { display: flex; align-items: center; gap: 0.6rem; }
  .toast.alert.critical { color: var(--alert); border-color: rgba(239, 122, 82, 0.55); }
  .toast.alert.warning { color: var(--nutrient); border-color: rgba(69, 200, 154, 0.45); }
  .dismiss { margin-left: auto; background: none; border: none; color: inherit; font-size: 1.1rem; cursor: pointer; }

  .grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: clamp(1rem, 2.5vw, 2rem);
    margin-top: 1.5rem;
  }

  /* ---- signature: the reservoir ---- */
  .reservoir {
    background: var(--ink-2);
    border: var(--hair);
    border-radius: var(--radius);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
  }
  .reservoir .eyebrow { align-self: flex-start; }
  .vessel {
    position: relative;
    width: 132px;
    height: 300px;
    border: 2px solid var(--ink-3);
    border-radius: 14px;
    background: linear-gradient(180deg, #0a1417, #0c1d20);
    overflow: hidden;
  }
  .liquid {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, var(--water), var(--nutrient));
    transition: height 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .waterline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.55);
  }
  .reservoir.low .liquid {
    background: linear-gradient(180deg, var(--alert), #b8472f);
  }
  .ticks {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 22% 0;
    pointer-events: none;
  }
  .ticks i {
    height: 1px;
    margin-left: auto;
    width: 14px;
    background: rgba(255, 255, 255, 0.18);
  }
  .readout {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .readout .big {
    font-family: var(--mono);
    font-size: 2rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .readout .unit { font-size: 1rem; color: var(--muted); }
  .readout .sub { font-size: 0.8rem; color: var(--muted); }
  .readout .sub strong { color: var(--text); font-family: var(--mono); }
  .warn { color: var(--alert); font-size: 0.8rem; margin: 0; }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }
  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.8rem;
  }
  .section-head h2 { font-size: 1.05rem; }
  .section-head .meta {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    letter-spacing: 0.08em;
  }

  .zone-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 0.9rem;
  }
  .card {
    position: relative;
    background: var(--ink-2);
    border: var(--hair);
    border-left: 3px solid var(--nutrient);
    border-radius: var(--radius);
    padding: 0.9rem 1rem 1.4rem;
    transition: box-shadow 0.3s, border-color 0.3s;
  }
  .card.critical { border-left-color: var(--alert); }
  .card.flash { box-shadow: inset 0 0 0 1px var(--water); }
  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .card-top h3 { font-size: 0.98rem; }
  .tag {
    font-family: var(--mono);
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--nutrient);
    border: 1px solid rgba(69, 200, 154, 0.35);
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
  }
  .tag.critical {
    color: var(--alert);
    border-color: rgba(239, 122, 82, 0.45);
  }
  .readings {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 0.75rem;
    margin: 0.85rem 0 0;
  }
  .readings div { display: flex; flex-direction: column; gap: 0.1rem; }
  .readings dt {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .readings dd {
    margin: 0;
    font-family: var(--mono);
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }
  .readings .u { font-size: 0.75rem; color: var(--muted); margin-left: 1px; }
  .readings .hot dd { color: var(--alert); }
  .zone-id {
    position: absolute;
    right: 0.9rem;
    bottom: 0.6rem;
    font-family: var(--mono);
    font-size: 0.62rem;
    color: var(--ink-3);
    letter-spacing: 0.1em;
  }

  .feed { border-top: var(--hair); padding-top: 1.4rem; }
  .empty { color: var(--muted); font-size: 0.9rem; }
  .feed-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .decision {
    display: grid;
    grid-template-columns: 88px 90px 1fr;
    gap: 0.75rem;
    align-items: baseline;
    padding: 0.6rem 0;
    border-bottom: var(--hair);
    font-size: 0.85rem;
    animation: slide 0.35s ease;
  }
  @keyframes slide {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .d-zone { font-family: var(--mono); color: var(--text); }
  .d-verb {
    font-family: var(--mono);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .decision.fulfilled .d-verb { color: var(--nutrient); }
  .decision.rejected .d-verb { color: var(--alert); }
  .decision.queued .d-verb { color: var(--water); }
  .d-reason { color: var(--muted); }

  @media (max-width: 760px) {
    .grid { grid-template-columns: 1fr; }
    .reservoir { flex-direction: row; flex-wrap: wrap; align-items: center; }
    .vessel { height: 180px; width: 100px; }
    .decision { grid-template-columns: 1fr; gap: 0.15rem; }
  }
</style>
