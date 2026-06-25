<!-- services/frontend-web/src/routes/zones/[zoneId]/+page.svelte -->
<script>
  export let data;
  const W = 720, H = 260, PAD = 32;
  $: pts = data.points.filter((p) => p.value !== null && p.value !== undefined);
  $: values = pts.map((p) => p.value);
  $: min = values.length ? Math.min(...values) : 0;
  $: max = values.length ? Math.max(...values) : 1;
  $: span = max - min || 1;
  $: coords = pts.map((p, i) => {
    const x = PAD + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (W - 2 * PAD));
    const y = H - PAD - ((p.value - min) / span) * (H - 2 * PAD);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  $: polyline = coords.join(' ');
</script>

<div class="wrap">
  <header>
    <a href="/">← Dashboard</a>
    <h1>{data.zoneId}</h1>
    <nav>
      {#each data.params as p}
        <a class:on={p === data.param} href="?param={p}">{p}</a>
      {/each}
    </nav>
  </header>

  {#if pts.length === 0}
    <p class="empty">No history yet for <strong>{data.param}</strong> — let the zone publish for a minute, then refresh.</p>
  {:else}
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="{data.param} history for {data.zoneId}">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} class="axis" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} class="axis" />
      <text x={PAD - 6} y={PAD + 4} class="tick" text-anchor="end">{max.toFixed(2)}</text>
      <text x={PAD - 6} y={H - PAD} class="tick" text-anchor="end">{min.toFixed(2)}</text>
      <polyline points={polyline} class="line" fill="none" />
    </svg>
    <p class="meta">{pts.length} points · latest {values[values.length - 1]?.toFixed(2)}</p>
  {/if}
</div>

<style>
  .wrap { max-width: 820px; margin: 0 auto; padding: clamp(1.25rem, 3vw, 2.5rem); }
  header { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; border-bottom: var(--hair); padding-bottom: 1rem; }
  header a { color: var(--muted); text-decoration: none; font-size: 0.85rem; }
  header h1 { font-size: clamp(1.4rem, 3vw, 2rem); font-family: var(--mono); }
  nav { margin-left: auto; display: flex; gap: 0.5rem; }
  nav a { font-family: var(--mono); font-size: 0.72rem; padding: 0.25rem 0.55rem; border: var(--hair); border-radius: 999px; }
  nav a.on { color: var(--ink); background: var(--nutrient); border-color: var(--nutrient); }
  svg { width: 100%; height: auto; margin-top: 1.5rem; background: var(--ink-2); border: var(--hair); border-radius: var(--radius); }
  .axis { stroke: var(--ink-3); stroke-width: 1; }
  .tick { fill: var(--muted); font-family: var(--mono); font-size: 11px; }
  .line { stroke: var(--water); stroke-width: 2; }
  .empty { color: var(--muted); margin-top: 1.5rem; }
  .meta { font-family: var(--mono); font-size: 0.75rem; color: var(--muted); margin-top: 0.5rem; }
</style>
