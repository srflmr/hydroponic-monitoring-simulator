<script>
  import ArbitrationLog from '$lib/components/ArbitrationLog.svelte';
  import { mapLog } from '$lib/mappers.js';
  export let data;
  $: rows = data.logs.map(mapLog);
</script>
<svelte:head><title>Arbitration log · HMS</title></svelte:head>
<section class="page">
  <div class="pagehead">
    <span class="h">Arbitration log</span>
    <span class="s">{data.total} decisions recorded</span>
  </div>
  <ArbitrationLog logs={rows} variant="row" title="" />
</section>
<style>
  .page { width: 100%; max-width: var(--page-max); margin-inline: auto; padding: var(--space-8) clamp(var(--space-4), 4vw, var(--space-8)) var(--space-10); display: flex; flex-direction: column; gap: var(--space-6); }
  .pagehead { display: flex; flex-direction: column; gap: var(--space-1); }
  .pagehead .h { font-size: var(--text-xl); font-weight: 700; letter-spacing: -.01em; }
  .pagehead .s { font-size: var(--text-base); color: var(--ink-3); }
</style>
