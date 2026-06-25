<script>
  import { onMount } from 'svelte';
  import Nav from '$lib/components/Nav.svelte';
  import { seedFarm, connectStream } from '$lib/sim.js';

  export let data;
  seedFarm(data);                 // seed synchronously from SSR so first paint has data
  onMount(() => connectStream()); // returns cleanup; Svelte calls it on destroy
</script>

<Nav />
<slot />
