<script>
  export let data;
</script>

<div class="wrap">
  <header><a href="/">← Dashboard</a><h1>Arbitration log</h1><span class="meta">{data.total} decisions</span></header>
  {#if data.logs.length === 0}
    <p class="empty">No arbitration decisions recorded yet.</p>
  {:else}
    <table>
      <thead><tr><th>Time</th><th>Zone</th><th>Decision</th><th>Reason</th><th>Tank after</th></tr></thead>
      <tbody>
        {#each data.logs as log (log.id)}
          <tr class="d-{log.decision}">
            <td class="mono">{log.requested_at}</td>
            <td class="mono">{log.zone_id}</td>
            <td class="verb">{log.decision}</td>
            <td>{log.reason}</td>
            <td class="mono">{log.tank_volume_after ?? '—'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .wrap { max-width: 1100px; margin: 0 auto; padding: clamp(1.25rem, 3vw, 2.5rem); }
  header { display: flex; align-items: baseline; gap: 1rem; border-bottom: var(--hair); padding-bottom: 1rem; }
  header a { color: var(--muted); text-decoration: none; font-size: 0.85rem; }
  header h1 { font-size: clamp(1.4rem, 3vw, 2rem); }
  header .meta { margin-left: auto; font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
  th, td { text-align: left; padding: 0.55rem 0.6rem; border-bottom: var(--hair); vertical-align: top; }
  th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
  .mono { font-family: var(--mono); }
  .verb { font-family: var(--mono); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; }
  .d-fulfilled .verb { color: var(--nutrient); }
  .d-rejected .verb { color: var(--alert); }
  .d-queued .verb { color: var(--water); }
  .empty { color: var(--muted); margin-top: 1.5rem; }
</style>
