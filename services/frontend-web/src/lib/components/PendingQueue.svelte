<script>
  import { farm } from '$lib/sim.js';

  // Sort queued zones by score descending.
  $: sorted = [...$farm.queue].sort((a, b) => b.score - a.score);

  function zoneName(zone_id) {
    const z = $farm.zones.find((z) => z.id === zone_id);
    return z ? z.name : zone_id;
  }
</script>

<div class="log">
  <div class="head">
    <span class="cap">Pending queue</span>
    {#if sorted.length > 0}
      <span class="live"></span>
    {/if}
  </div>

  <div class="items">
    {#if sorted.length === 0}
      <span class="empty">No pending requests.</span>
    {:else}
      {#each sorted as item (item.zone_id)}
        <div class="row">
          <div class="tag">
            <span class="sym">⋯</span>
            <span class="label">Queued</span>
          </div>
          <span class="zone">{zoneName(item.zone_id)}</span>
          <span class="score" title="Arbitration score">score {item.score.toFixed(3)}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .log {
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius);
    padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3);
  }
  .head { display: flex; align-items: center; gap: var(--space-3); }
  .cap { font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .live { width: 7px; height: 7px; border-radius: 50%; background: var(--warn-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .items { display: flex; flex-direction: column; }

  .empty { font-size: var(--text-sm); color: var(--muted); padding: var(--space-2) 0; }

  .row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--hair-2); }
  .row:last-child { border-bottom: none; }
  .tag { display: flex; align-items: center; gap: var(--space-2); width: 118px; flex-shrink: 0; }
  .sym {
    width: 18px; height: 18px; border-radius: 6px; font-size: var(--text-2xs); font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    background: var(--warn-soft); color: var(--warn);
  }
  .label { font-size: var(--text-sm); font-weight: 600; color: var(--warn); }
  .zone { font-size: var(--text-sm); font-weight: 600; color: var(--ink-2); flex: 1; }
  .score { font-family: var(--mono); font-size: var(--text-xs); color: var(--muted); flex-shrink: 0; }

  @keyframes livePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
</style>
