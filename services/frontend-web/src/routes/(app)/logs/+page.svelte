<script>
  import ArbitrationLog from '$lib/components/ArbitrationLog.svelte';
  import { mapLog, splitName } from '$lib/mappers.js';

  export let data;

  let rows = data.logs.map(mapLog);
  // Server total at last fetch — kept as its own state (not the SSR-load-time data.total)
  // because new decisions keep streaming in from the live simulator while this page sits
  // open; each Load More response refreshes it so the count stays honest.
  let total = data.total;
  let loading = false;
  let error = '';

  $: zoneOptions = data.zones.map((z) => ({ id: z.zone_id, name: splitName(z.name).name }));
  $: hasMore = rows.length < total;

  let selectedZoneId = 'all';
  $: filteredRows = selectedZoneId === 'all' ? rows : rows.filter((r) => r.zone_id === selectedZoneId);
  $: selectedZoneName = zoneOptions.find((z) => z.id === selectedZoneId)?.name ?? '';
  // "All zones": count is against the true server total. A specific zone: no server-side
  // zone filter exists, so the count is only ever against what's been loaded so far.
  $: countLabel = selectedZoneId === 'all'
    ? `Showing ${rows.length} of ${total} decisions`
    : `Showing ${filteredRows.length} decisions for ${selectedZoneName} (from ${rows.length} of ${total} loaded)`;

  async function loadMore() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/logs?limit=${data.pageSize}&offset=${rows.length}`);
      if (!res.ok) throw new Error(`logs ${res.status}`);
      const body = await res.json();
      rows = [...rows, ...(body.logs || []).map(mapLog)];
      if (typeof body.total === 'number') total = body.total;
    } catch (err) {
      error = 'Could not load more decisions.';
    } finally {
      loading = false;
    }
  }
</script>
<svelte:head><title>Arbitration log · HMS</title></svelte:head>
<section class="page">
  <div class="pagehead">
    <span class="h">Arbitration log</span>
    <span class="s">{countLabel}</span>
  </div>

  {#if zoneOptions.length > 0}
    <div class="filters">
      <label class="filter">
        <span>Zone</span>
        <select bind:value={selectedZoneId}>
          <option value="all">All zones</option>
          {#each zoneOptions as z (z.id)}
            <option value={z.id}>{z.name}</option>
          {/each}
        </select>
      </label>
    </div>
  {/if}

  <ArbitrationLog logs={filteredRows} variant="row" title="" maxHeight="640px" />

  {#if selectedZoneId === 'all' && hasMore}
    <div class="more">
      <button on:click={loadMore} disabled={loading}>{loading ? 'Loading…' : `Load more (${data.total - rows.length} remaining)`}</button>
      {#if error}<span class="err">{error}</span>{/if}
    </div>
  {/if}
</section>
<style>
  .page { width: 100%; max-width: var(--page-max); margin-inline: auto; padding: var(--space-8) clamp(var(--space-4), 4vw, var(--space-8)) var(--space-10); display: flex; flex-direction: column; gap: var(--space-6); }
  .pagehead { display: flex; flex-direction: column; gap: var(--space-1); }
  .pagehead .h { font-size: var(--text-xl); font-weight: 700; letter-spacing: -.01em; }
  .pagehead .s { font-size: var(--text-base); color: var(--ink-3); }

  .filters { display: flex; gap: var(--space-4); }
  .filter { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--ink-2); }
  .filter select {
    font-family: var(--font); font-size: var(--text-sm); color: var(--ink);
    background: var(--surface-2); border: 1px solid var(--hair); border-radius: var(--radius-xs);
    padding: var(--space-2) var(--space-3); cursor: pointer;
  }

  .more { display: flex; align-items: center; gap: var(--space-3); justify-content: center; }
  .more button {
    border: 1px solid var(--hair); cursor: pointer; padding: var(--space-3) var(--space-5); border-radius: var(--radius-xs);
    background: var(--surface); color: var(--ink-2); font-family: var(--font); font-size: var(--text-sm); font-weight: 600;
  }
  .more button:hover:not(:disabled) { background: var(--surface-2); }
  .more button:disabled { opacity: .6; cursor: default; }
  .err { font-size: var(--text-sm); color: var(--crit); }
</style>
