<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { farm } from '$lib/sim.js';

  let menuOpen = false;
  const toggleMenu = () => (menuOpen = !menuOpen);

  function navigate(path) {
    menuOpen = false;
    goto(path);
  }
  function logout() {
    window.location.href = 'https://auth.hydroponic.localhost/logout';
  }

  $: path = $page.url.pathname;
  $: isDash = path === '/';
  $: isConfig = path.startsWith('/config');
</script>

<header>
  <div class="left">
    <div class="brand">
      <span class="mark"><span class="leaf"></span></span>
      <span class="name">HMS</span>
    </div>
    <nav>
      <button class:active={isDash} on:click={() => navigate('/')}>Dashboard</button>
      <button class:active={isConfig} on:click={() => navigate('/config')}>Configuration</button>
      <button class:active={path.startsWith('/zones')} on:click={() => navigate('/zones/zone-a')}>Zones</button>
      <button class:active={path.startsWith('/logs')} on:click={() => navigate('/logs')}>Logs</button>
    </nav>
  </div>

  <div class="right">
    <div class="live">
      <span class="dot"></span>
      <span class="lbl">Live</span>
      <span class="clock">{$farm.now}</span>
    </div>

    <div class="profile">
      <button class="chip" class:open={menuOpen} on:click={toggleMenu}>
        <span class="avatar">O</span>
        <span class="who">Operator</span>
        <span class="caret" style="transform:rotate({menuOpen ? 180 : 0}deg)">▼</span>
      </button>
      {#if menuOpen}
        <div class="menu">
          <div class="meta">
            <span class="mname">Operator</span>
            <span class="memail">operator@hydroponic.localhost</span>
          </div>
          <button class="signout" on:click={logout}>Sign out</button>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    gap: 14px; flex-wrap: wrap; row-gap: 10px;
    padding: 10px clamp(16px, 4vw, 32px); min-height: 66px;
    background: var(--header); border-bottom: 1px solid var(--hair);
  }
  .left { display: flex; align-items: center; gap: 34px; flex-wrap: wrap; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .mark { width: 38px; height: 38px; border-radius: 12px; background: var(--nutrient); display: flex; align-items: center; justify-content: center; }
  .leaf { width: 13px; height: 13px; border-radius: 50% 50% 50% 0; background: var(--ok-soft); transform: rotate(45deg); }
  .name { font-size: 18px; font-weight: 700; }

  nav { display: flex; align-items: center; gap: 8px; }
  nav button {
    border: none; background: none; cursor: pointer;
    padding: 9px 14px; border-radius: 10px;
    font-family: var(--font); font-size: 14px; font-weight: 600; color: var(--ink-3);
  }
  nav button:hover { background: #F1EADB; }
  nav button.active { color: var(--ok); background: var(--accent-soft); }

  .right { display: flex; align-items: center; gap: 18px; }
  .live { display: flex; align-items: center; gap: 8px; padding: 7px 13px; background: var(--accent-soft); border-radius: 999px; }
  .live .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .live .lbl { font-size: 13px; font-weight: 600; color: var(--ok); }
  .live .clock { font-family: var(--mono); font-size: 13px; color: var(--ok); }

  .profile { position: relative; }
  .chip {
    display: flex; align-items: center; gap: 9px;
    border: 1px solid #E2D8C0; background: var(--surface); cursor: pointer;
    padding: 6px 12px 6px 6px; border-radius: 999px; font-family: var(--font);
  }
  .chip:hover, .chip.open { background: #F1EADB; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: #E8DFC9; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #8A7456; }
  .who { font-size: 14px; font-weight: 500; color: var(--ink-2); }
  .caret { font-size: 10px; color: var(--muted); transition: transform .15s ease; }

  .menu {
    position: absolute; right: 0; top: 48px; min-width: 200px;
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius-sm);
    box-shadow: 0 14px 34px -16px rgba(60,48,30,.4); padding: 8px; z-index: 30;
    display: flex; flex-direction: column; gap: 2px;
  }
  .meta { padding: 9px 12px 10px; border-bottom: 1px solid var(--hair-2); display: flex; flex-direction: column; gap: 1px; }
  .mname { font-size: 14px; font-weight: 600; color: var(--ink); }
  .memail { font-size: 12px; color: var(--muted); }
  .signout {
    border: none; background: none; cursor: pointer; text-align: left;
    padding: 11px 12px; border-radius: 9px; font-family: var(--font);
    font-size: 14px; font-weight: 600; color: var(--crit);
  }
  .signout:hover { background: var(--crit-soft); }
</style>
