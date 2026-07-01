<!-- services/frontend-web/src/lib/components/Glossary.svelte -->
<script>
  export let term;
  export let definition;
</script>

<span class="glossary" title="{term}: {definition}" tabindex="0">
  <slot />
</span>

<style>
  .glossary {
    border-bottom: 1px dotted var(--muted);
    cursor: help;
  }
  .glossary:focus-visible {
    outline: 2px solid var(--nutrient);
    outline-offset: 2px;
    border-radius: 2px;
  }
</style>
