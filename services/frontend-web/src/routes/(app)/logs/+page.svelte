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
  .page { padding: 30px clamp(16px, 4vw, 32px) 40px; display: flex; flex-direction: column; gap: 22px; }
  .pagehead { display: flex; flex-direction: column; gap: 4px; }
  .pagehead .h { font-size: 24px; font-weight: 700; letter-spacing: -.01em; }
  .pagehead .s { font-size: 14px; color: var(--ink-3); }
</style>
