<script>
  import { applyConfig } from '$lib/sim.js';
  import { splitName } from '$lib/mappers.js';

  export let data;

  const FIELDS = ['phMin', 'phMax', 'ecMin', 'ecMax', 'tempMin', 'tempMax', 'priority'];

  let draft = {};       // { [zoneId]: { field: string } }
  let zoneMeta = [];    // [{ id, name, crop }]
  let toast = '';
  let toastError = false;
  let toastTimer = null;

  function buildDraft() {
    const zones = data.zones || [];
    const d = {};
    zoneMeta = zones.map((z) => {
      const { name, crop } = splitName(z.name);
      return { id: z.zone_id, name, crop };
    });
    zones.forEach((z) => {
      d[z.zone_id] = {
        phMin: String(z.ph_min), phMax: String(z.ph_max),
        ecMin: String(z.ec_min), ecMax: String(z.ec_max),
        tempMin: String(z.temp_min), tempMax: String(z.temp_max),
        priority: String(z.priority)
      };
    });
    draft = d;
  }

  buildDraft();

  async function save() {
    const errors = await applyConfig(draft);
    clearTimeout(toastTimer);
    if (errors && errors.length > 0) {
      toastError = true;
      toast = `Save failed for: ${errors.map((e) => e.zoneId).join(', ')}`;
    } else {
      toastError = false;
      toast = 'Configuration saved';
    }
    toastTimer = setTimeout(() => (toast = ''), 2200);
  }

  function reset() {
    buildDraft();
  }
</script>

<svelte:head><title>Configuration · HMS</title></svelte:head>

<section class="page">
  <div class="pagehead">
    <div class="intro">
      <span class="h">Zone configuration</span>
      <span class="s">Set thresholds and priority per zone · changes drive live evaluation &amp; arbitration</span>
    </div>
    <div class="actions">
      <button class="ghost" on:click={reset}>Reset</button>
      <button class="save" on:click={save}>Save configuration</button>
    </div>
  </div>

  <div class="grid">
    {#each zoneMeta as z (z.id)}
      {#if draft[z.id]}
      <div class="card">
        <div class="top">
          <div class="title">
            <span class="crop">{z.crop}</span>
            <span class="sub">{z.name}</span>
          </div>
          <div class="prio">
            <span class="cap">Priority</span>
            <input type="number" min="1" max="10" step="1" bind:value={draft[z.id].priority} />
          </div>
        </div>

        <div class="fields">
          <div class="field">
            <span class="flbl">pH range</span>
            <div class="pair">
              <input type="number" step="0.1" bind:value={draft[z.id].phMin} />
              <span class="to">to</span>
              <input type="number" step="0.1" bind:value={draft[z.id].phMax} />
            </div>
          </div>
          <div class="field">
            <span class="flbl">EC range <span class="dim">mS/cm</span></span>
            <div class="pair">
              <input type="number" step="0.1" bind:value={draft[z.id].ecMin} />
              <span class="to">to</span>
              <input type="number" step="0.1" bind:value={draft[z.id].ecMax} />
            </div>
          </div>
          <div class="field">
            <span class="flbl">Water temp range <span class="dim">°C</span></span>
            <div class="pair">
              <input type="number" step="0.5" bind:value={draft[z.id].tempMin} />
              <span class="to">to</span>
              <input type="number" step="0.5" bind:value={draft[z.id].tempMax} />
            </div>
          </div>
        </div>
      </div>
      {/if}
    {/each}
  </div>
</section>

{#if toast}
  <div class="toast" class:toast-error={toastError}>
    <span class="tdot"></span>
    <span>{toast}</span>
  </div>
{/if}

<style>
  .page { padding: 30px clamp(16px, 4vw, 32px) 40px; display: flex; flex-direction: column; gap: 22px; }
  .pagehead { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
  .intro { display: flex; flex-direction: column; gap: 4px; }
  .intro .h { font-size: 24px; font-weight: 700; letter-spacing: -.01em; }
  .intro .s { font-size: 14px; color: var(--ink-3); }
  .actions { display: flex; gap: 10px; }
  .ghost { border: 1px solid #E2D8C0; background: var(--surface); cursor: pointer; padding: 11px 18px; border-radius: 12px; font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--ink-3); }
  .ghost:hover { background: #F1EADB; }
  .save { border: none; cursor: pointer; padding: 11px 20px; border-radius: 12px; background: var(--nutrient); color: var(--header); font-family: var(--font); font-size: 14px; font-weight: 700; box-shadow: inset 0 -3px 0 rgba(0,0,0,.1); }
  .save:hover { background: var(--nutrient-strong); }

  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .card { background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; }
  .title { display: flex; flex-direction: column; gap: 3px; }
  .crop { font-size: 19px; font-weight: 700; }
  .sub { font-size: 12px; color: var(--muted); }
  .prio { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
  .cap { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 600; }

  .fields { display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 9px; }
  .flbl { font-size: 13px; font-weight: 600; color: var(--ink-2); }
  .dim { color: #B6A98E; font-weight: 400; }
  .pair { display: flex; align-items: center; gap: 10px; }
  .to { color: #B6A98E; font-size: 14px; }

  input {
    border: 1px solid #E2D8C0; border-radius: var(--radius-xs); background: var(--surface-2);
    font-family: var(--mono); font-size: 15px; color: var(--ink); text-align: center;
  }
  .pair input { flex: 1; padding: 11px; min-width: 0; }
  .prio input { width: 64px; padding: 9px; font-weight: 600; }

  .toast {
    position: fixed; left: 50%; bottom: 30px; transform: translateX(-50%); z-index: 50;
    display: flex; align-items: center; gap: 10px; padding: 13px 22px; border-radius: var(--radius-sm);
    background: var(--forest); color: #EFEAD9; box-shadow: 0 14px 34px -14px rgba(60,48,30,.5);
    animation: toastIn .25s ease;
  }
  .toast.toast-error { background: var(--crit); }
  .tdot { width: 8px; height: 8px; border-radius: 50%; background: #9ED27A; }
  .toast-error .tdot { background: #FFAAAA; }
  .toast span:last-child { font-size: 14px; font-weight: 600; }

  @media (max-width: 1180px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 620px)  { .grid { grid-template-columns: 1fr; } }
</style>
