<script>
  import { DECISION } from '$lib/data.js';

  export let logs = [];
  export let title = 'Arbitration log';
  export let variant = 'row';         // 'row' (overview table) | 'stack' (compact list)
</script>

<div class="log">
  <div class="head">
    <span class="cap">{title}</span>
    <span class="live"></span>
  </div>

  <div class="items" class:stack={variant === 'stack'}>
    {#each logs as l (l.id)}
      {@const d = DECISION[l.decision]}
      {#if variant === 'row'}
        <div class="row">
          <span class="time">{l.time}</span>
          <div class="tag">
            <span class="sym" style="background:{d.soft}; color:{d.txt}">{d.sym}</span>
            <span class="label" style="color:{d.txt}">{d.label}</span>
          </div>
          <span class="crop">{l.crop}</span>
          <span class="reason">{l.reason}</span>
        </div>
      {:else}
        <div class="entry">
          <span class="edot" style="background:{d.dot}"></span>
          <div class="ebody">
            <div class="eline">
              <span class="elabel" style="color:{d.txt}">{d.label} · {l.crop}</span>
              <span class="etime">{l.time}</span>
            </div>
            <span class="ereason">{l.reason}</span>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .log {
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius);
    padding: 24px; display: flex; flex-direction: column; gap: 14px;
  }
  .head { display: flex; align-items: center; gap: 10px; }
  .cap { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .live { width: 7px; height: 7px; border-radius: 50%; background: var(--ok-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .items { display: flex; flex-direction: column; }

  /* row variant */
  .row { display: flex; align-items: center; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--hair-2); }
  .time { font-family: var(--mono); font-size: 13px; color: var(--muted); width: 66px; flex-shrink: 0; }
  .tag { display: flex; align-items: center; gap: 7px; width: 118px; flex-shrink: 0; }
  .sym { width: 18px; height: 18px; border-radius: 6px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .label { font-size: 13px; font-weight: 600; }
  .crop { font-size: 13px; font-weight: 600; color: var(--ink-2); width: 90px; flex-shrink: 0; }
  .reason { font-size: 13px; color: var(--ink-3); flex: 1; }

  /* stack variant */
  .entry { display: flex; gap: 11px; padding: 9px 0; border-bottom: 1px solid var(--hair-2); }
  .edot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .ebody { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .eline { display: flex; justify-content: space-between; align-items: baseline; }
  .elabel { font-size: 13px; font-weight: 700; }
  .etime { font-family: var(--mono); font-size: 11px; color: var(--muted); }
  .ereason { font-size: 12px; color: var(--ink-3); line-height: 1.4; }

  @media (max-width: 560px) {
    .row { flex-wrap: wrap; gap: 6px 12px; }
    .reason { flex-basis: 100%; }
  }
</style>
