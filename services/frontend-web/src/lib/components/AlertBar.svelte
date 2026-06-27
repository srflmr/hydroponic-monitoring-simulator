<script>
  import { farm, dismissAlert } from '$lib/sim.js';
</script>

{#if $farm.alerts.length}
  <div class="alert-bar">
    {#each $farm.alerts as a (a.zone_id)}
      <div class="alert {a.severity}">
        <span class="zone">{a.zone_id}</span>
        <span class="msg">{a.message}</span>
        <button class="dismiss" on:click={() => dismissAlert(a.zone_id)} aria-label="Dismiss alert">✕</button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .alert-bar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
  .alert { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm, 10px); font-size: 14px; }
  .alert.critical { background: var(--crit-soft, #FBEAE5); color: var(--crit, #7E2A12); border-left: 4px solid var(--crit-ring, #C2412B); }
  .alert.warning  { background: var(--warn-soft, #FBF3E0); color: var(--warn, #7E5A12); border-left: 4px solid var(--warn-ring, #C2924B); }
  .zone { font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; font-size: 12px; }
  .msg { flex: 1; }
  .dismiss { background: none; border: none; cursor: pointer; font-size: 14px; opacity: .55; line-height: 1; }
  .dismiss:hover { opacity: 1; }
</style>
