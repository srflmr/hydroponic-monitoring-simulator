<script>
  import { DECISION } from '$lib/data.js';

  export let logs = [];
  export let title = 'Arbitration log';
  export let variant = 'row';         // 'row' (overview table) | 'stack' (compact list)
  export let maxHeight = null;        // e.g. '640px' — bounds .items to a fixed height with its own scrollbar
  export let fill = false;            // grow to fill a stretched grid/flex parent exactly, scrolling internally instead
</script>

<div class="log" class:fill>
  <div class="head">
    <span class="cap">{title}</span>
    <span class="live"></span>
  </div>

  <div
    class="items"
    class:stack={variant === 'stack'}
    class:scrollable={!!maxHeight || fill}
    style={maxHeight ? `max-height:${maxHeight}` : ''}
  >
    {#each logs as l (l.id)}
      {@const d = DECISION[l.decision] ?? { txt: 'var(--muted)', soft: 'var(--hair-2)', dot: 'var(--muted)', label: l.decision ?? 'unknown', sym: '?' }}
      {#if variant === 'row'}
        <div class="row">
          <span class="time">{l.time}</span>
          <div class="tag">
            <span class="sym" style="background:{d.soft}; color:{d.txt}">{d.sym}</span>
            <span class="label" style="color:{d.txt}">{d.label}</span>
          </div>
          <span class="zone">
            <span class="zname">{l.name}</span>
            <span class="zcrop">{l.crop}</span>
          </span>
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
    padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3);
  }
  /* fill: this card is a stretched grid/flex item (definite height from its parent) —
     let .items consume the remaining space via flex instead of the card's own
     content-driven height, so the card's bottom edge lands exactly at the parent's edge. */
  .log.fill { height: 100%; min-height: 0; }
  .head { display: flex; align-items: center; gap: var(--space-3); }
  .cap { font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  .live { width: 7px; height: 7px; border-radius: 50%; background: var(--ok-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .items { display: flex; flex-direction: column; }
  .log.fill .items { flex: 1; min-height: 0; }

  /* Bounded height + its own scrollbar (instead of letting the whole page grow),
     styled to match the theme rather than a bare default scrollbar. */
  .items.scrollable {
    overflow-y: auto; padding-right: var(--space-2);
    scrollbar-width: thin; scrollbar-color: var(--hair) transparent;
  }
  .items.scrollable::-webkit-scrollbar { width: 8px; }
  .items.scrollable::-webkit-scrollbar-track { background: transparent; }
  .items.scrollable::-webkit-scrollbar-thumb { background: var(--hair); border-radius: 8px; }
  .items.scrollable::-webkit-scrollbar-thumb:hover { background: var(--muted); }

  /* row variant */
  .row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--hair-2); }
  .time { font-family: var(--mono); font-size: var(--text-sm); color: var(--muted); width: 66px; flex-shrink: 0; }
  .tag { display: flex; align-items: center; gap: var(--space-2); width: 118px; flex-shrink: 0; }
  .sym { width: 18px; height: 18px; border-radius: 6px; font-size: var(--text-2xs); font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .label { font-size: var(--text-sm); font-weight: 600; }
  .zone { display: flex; flex-direction: column; gap: 1px; width: 100px; flex-shrink: 0; }
  .zname { font-size: var(--text-sm); font-weight: 600; color: var(--ink-2); }
  .zcrop { font-size: var(--text-2xs); color: var(--muted); }
  .reason { font-size: var(--text-sm); color: var(--ink-3); flex: 1; }

  /* stack variant */
  .entry { display: flex; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--hair-2); }
  .edot { width: 8px; height: 8px; border-radius: 50%; margin-top: var(--space-1); flex-shrink: 0; }
  .ebody { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .eline { display: flex; justify-content: space-between; align-items: baseline; }
  .elabel { font-size: var(--text-sm); font-weight: 700; }
  .etime { font-family: var(--mono); font-size: var(--text-2xs); color: var(--muted); }
  .ereason { font-size: var(--text-xs); color: var(--ink-3); line-height: 1.4; }

  @media (max-width: 560px) {
    .row { flex-wrap: wrap; gap: var(--space-2) var(--space-3); }
    .reason { flex-basis: 100%; }
  }
</style>
