<script>
  import { refillTank, forceTankLow } from '$lib/sim.js';

  export let tank;                    // { volume, capacity }
  export let serving = 0;

  $: pct = Math.round((tank.volume / tank.capacity) * 100);
  $: fill = pct < 20 ? 'var(--crit-ring)' : pct < 40 ? 'var(--warn-ring)' : 'var(--water)';
  $: statusTxt = pct < 20 ? 'Refill required' : pct < 40 ? 'Running low' : 'Healthy';
  $: statusCol = pct < 20 ? 'var(--crit)' : pct < 40 ? 'var(--warn)' : 'var(--ok)';

  let addAmount = '';
  function doRefill() {
    const n = parseFloat(addAmount);
    refillTank(Number.isFinite(n) && n > 0 ? n : undefined);
    addAmount = '';
  }
</script>

<div class="tank">
  <div class="head">
    <span class="cap">Nutrient tank</span>
    <span class="status" style="color:{statusCol}">{statusTxt}</span>
  </div>

  <div class="body">
    <div class="vessel">
      <div class="liquid" style="height:{pct}%; background:{fill}"></div>
      <div class="surface" style="bottom:{pct}%"></div>
    </div>
    <div class="readout">
      <span class="big">{pct}<span class="unit">%</span></span>
      <span class="line">{Math.round(tank.volume)} / {tank.capacity} L</span>
      <span class="line">{serving} zone(s) drawing</span>
    </div>
  </div>

  <div class="controls">
    <input type="number" min="1" step="5" placeholder="+L" bind:value={addAmount} aria-label="Refill amount (liters)" />
    <button on:click={doRefill}>Refill</button>
    <button class="ghost" on:click={() => forceTankLow(20)}>Force low (demo)</button>
  </div>
</div>

<style>
  .tank {
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius);
    padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5);
  }
  .head { display: flex; align-items: center; justify-content: space-between; }
  .cap { font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .status { font-size: var(--text-xs); font-weight: 600; }
  .body { display: flex; gap: var(--space-5); align-items: center; }
  .vessel {
    position: relative; width: 104px; height: 184px; border-radius: 18px;
    background: var(--bg); overflow: hidden; border: 1px solid #E2D8C0;
  }
  .liquid { position: absolute; left: 0; right: 0; bottom: 0; transition: height .6s ease; }
  .surface { position: absolute; left: 0; right: 0; height: 6px; background: rgba(255,255,255,.45); animation: ripple 3s ease-in-out infinite; }
  .readout { display: flex; flex-direction: column; gap: var(--space-2); }
  .big { font-family: var(--mono); font-size: var(--text-display); font-weight: 700; line-height: 1; }
  .unit { font-size: var(--text-lg); color: var(--muted); }
  .line { font-size: var(--text-sm); color: var(--ink-3); }
  .controls { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
  .controls input {
    flex: 0 0 80px; padding: var(--space-3) var(--space-3); border-radius: var(--radius-sm); border: 1px solid #E2D8C0;
    font-family: var(--font); font-size: var(--text-base); background: var(--bg); color: var(--ink);
    width: 80px;
  }
  button {
    border: none; cursor: pointer; padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm);
    background: var(--nutrient); color: var(--header);
    font-family: var(--font); font-size: var(--text-base); font-weight: 700; letter-spacing: .02em;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.1);
  }
  button:hover { background: var(--nutrient-strong); }
  button.ghost {
    background: var(--surface); color: var(--ink-3); border: 1px solid #E2D8C0;
    box-shadow: none;
  }
  button.ghost:hover { background: #F1EADB; }
</style>
