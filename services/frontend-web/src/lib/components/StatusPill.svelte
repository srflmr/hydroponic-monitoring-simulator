<script>
  export let txt = 'var(--ok)';
  export let soft = 'var(--ok-soft)';
  export let dot = 'var(--ok-ring)';
  export let label = '';
</script>

<span class="pill" style="background:{soft}; color:{txt}">
  <span class="dot" style="background:{dot}"></span>
  {label}
</span>

<style>
  .pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 12px; border-radius: 999px;
    font-size: 12px; font-weight: 600;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; }
</style>
