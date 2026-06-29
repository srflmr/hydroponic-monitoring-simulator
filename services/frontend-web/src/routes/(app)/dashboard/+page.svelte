<script>
  import { farm, triggerContention } from '$lib/sim.js';
  import ZoneCard from '$lib/components/ZoneCard.svelte';
  import TankGauge from '$lib/components/TankGauge.svelte';
  import ArbitrationLog from '$lib/components/ArbitrationLog.svelte';
  import PendingQueue from '$lib/components/PendingQueue.svelte';
  import AlertBar from '$lib/components/AlertBar.svelte';

  $: zones = $farm.zones;
  $: serving = $farm.serving;
  $: servingCount = Object.keys(serving).length;
  $: logsTop = $farm.logs.slice(0, 6);
</script>

<svelte:head><title>Live overview · HMS</title></svelte:head>

<section class="page">
  <div class="pagehead">
    <div class="intro">
      <span class="h">Live overview</span>
      <span class="s">All zones updating in real time · select a zone for detail</span>
    </div>
    <button class="demo" on:click={() => triggerContention()}>Trigger contention (all zones)</button>
  </div>

  <AlertBar />

  <div class="zones">
    {#each zones as zone (zone.id)}
      <ZoneCard {zone} flow={!!serving[zone.id]} queued={$farm.queue.some((q) => q.zone_id === zone.id)} />
    {/each}
  </div>

  <div class="bottom">
    <TankGauge tank={$farm.tank} serving={servingCount} />
    <ArbitrationLog logs={logsTop} variant="row" />
  </div>

  <div class="pending-row">
    <PendingQueue />
  </div>
</section>

<style>
  .page { padding: 30px clamp(16px, 4vw, 32px) 40px; display: flex; flex-direction: column; gap: 22px; }
  .pagehead { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
  .intro { display: flex; flex-direction: column; gap: 4px; }
  .intro .h { font-size: 24px; font-weight: 700; letter-spacing: -.01em; }
  .intro .s { font-size: 14px; color: var(--ink-3); }
  .zones { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .bottom { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 20px; }
  .pending-row { display: grid; grid-template-columns: minmax(0, 380px); gap: 20px; }

  .demo {
    border: none; cursor: pointer; padding: 10px 18px; border-radius: var(--radius-xs);
    background: var(--warn-ring, #d97b1e); color: #fff;
    font-family: var(--font); font-size: 14px; font-weight: 700; letter-spacing: .02em;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.12);
  }
  .demo:hover { filter: brightness(1.1); }

  @media (max-width: 1180px) { .zones { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px)  { .bottom { grid-template-columns: 1fr; } }
  @media (max-width: 620px)  { .zones { grid-template-columns: 1fr; } }
</style>
