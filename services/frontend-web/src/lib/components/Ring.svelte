<script>
  // Circular gauge. Geometry is derived from `size`, so it scales cleanly.
  export let value = '';
  export let label = '';
  export let pct = 0;                 // 0..1 fill
  export let ring = 'var(--nutrient)';
  export let soft = 'var(--ok-soft)';
  export let size = 72;

  $: r = size / 2 - 10;
  $: circ = 2 * Math.PI * r;
  $: offset = circ * (1 - pct);
</script>

<div class="ring">
  <div class="dial" style="width:{size}px; height:{size}px">
    <svg width={size} height={size} viewBox="0 0 {size} {size}">
      <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={soft} stroke-width="7" />
      <circle
        cx={size / 2} cy={size / 2} {r}
        fill="none" stroke={ring} stroke-width="7" stroke-linecap="round"
        stroke-dasharray={circ} stroke-dashoffset={offset}
        transform="rotate(-90 {size / 2} {size / 2})"
      />
    </svg>
    <span class="val">{value}</span>
  </div>
  {#if label}<span class="lab">{label}</span>{/if}
</div>

<style>
  .ring { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .dial { position: relative; }
  .val {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-weight: 600; font-size: 15px; color: var(--ink);
  }
  .lab {
    font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--muted); font-weight: 600;
  }
</style>
