<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { farm } from '$lib/sim.js';

  let menuOpen = false;
  const toggleMenu = () => (menuOpen = !menuOpen);

  let navOpen = false;
  const toggleNav = () => (navOpen = !navOpen);

  function navigate(path) {
    menuOpen = false;
    navOpen = false;
    goto(path);
  }
  function logout() {
    window.location.href = 'https://auth.hydroponic.localhost/logout?rd=https://hydroponic.localhost/';
  }

  $: path = $page.url.pathname;
  $: isDash = path === '/dashboard';
  $: isConfig = path.startsWith('/config');
</script>

<header>
  <div class="left">
    <div class="brand">
      <span class="mark"><span class="leaf"></span></span>
      <span class="name">HMS</span>
    </div>
    <nav class="desktop-nav">
      <button class:active={isDash} on:click={() => navigate('/dashboard')}>Dashboard</button>
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

    <button
      class="hamburger"
      class:open={navOpen}
      aria-label="Toggle navigation menu"
      aria-expanded={navOpen}
      on:click={toggleNav}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</header>

{#if navOpen}
  <div class="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <button class:active={isDash} on:click={() => navigate('/dashboard')}>Dashboard</button>
    <button class:active={isConfig} on:click={() => navigate('/config')}>Configuration</button>
    <button class:active={path.startsWith('/zones')} on:click={() => navigate('/zones/zone-a')}>Zones</button>
    <button class:active={path.startsWith('/logs')} on:click={() => navigate('/logs')}>Logs</button>
  </div>
{/if}

<style>
  header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) clamp(var(--space-4), 4vw, var(--space-8));
    min-height: 60px;
    background: var(--header); border-bottom: 1px solid var(--hair);
  }
  .left { display: flex; align-items: center; gap: var(--space-8); }
  .brand { display: flex; align-items: center; gap: var(--space-3); }
  .mark { width: 38px; height: 38px; border-radius: 12px; background: var(--nutrient); display: flex; align-items: center; justify-content: center; }
  .leaf { width: 13px; height: 13px; border-radius: 50% 50% 50% 0; background: var(--ok-soft); transform: rotate(45deg); }
  .name { font-size: var(--text-lg); font-weight: 700; }

  .desktop-nav { display: flex; align-items: center; gap: var(--space-2); }
  .desktop-nav button {
    border: none; background: none; cursor: pointer;
    padding: var(--space-2) var(--space-3); border-radius: 10px;
    font-family: var(--font); font-size: var(--text-base); font-weight: 600; color: var(--ink-3);
  }
  .desktop-nav button:hover { background: #F1EADB; }
  .desktop-nav button.active { color: var(--ok); background: var(--accent-soft); }
  .desktop-nav button:focus-visible {
    outline: 2px solid var(--ok); outline-offset: 2px;
  }

  .right { display: flex; align-items: center; gap: var(--space-4); }
  .live { display: flex; align-items: center; gap: var(--space-2); padding: 7px var(--space-3); background: var(--accent-soft); border-radius: 999px; }
  .live .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok-ring); animation: livePulse 1.8s ease-in-out infinite; }
  .live .lbl { font-size: var(--text-sm); font-weight: 600; color: var(--ok); }
  .live .clock { font-family: var(--mono); font-size: var(--text-sm); color: var(--ok); }

  .profile { position: relative; }
  .chip {
    display: flex; align-items: center; gap: var(--space-2);
    border: 1px solid #E2D8C0; background: var(--surface); cursor: pointer;
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1); border-radius: 999px; font-family: var(--font);
  }
  .chip:hover, .chip.open { background: #F1EADB; }
  .chip:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: #E8DFC9; display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); font-weight: 700; color: #8A7456; }
  .who { font-size: var(--text-base); font-weight: 500; color: var(--ink-2); }
  .caret { font-size: 10px; color: var(--muted); transition: transform .15s ease; }

  .menu {
    position: absolute; right: 0; top: 48px; min-width: 200px;
    background: var(--surface); border: 1px solid var(--hair); border-radius: var(--radius-sm);
    box-shadow: 0 14px 34px -16px rgba(60,48,30,.4); padding: var(--space-2); z-index: 30;
    display: flex; flex-direction: column; gap: 2px;
  }
  .meta { padding: var(--space-2) var(--space-3) var(--space-2); border-bottom: 1px solid var(--hair-2); display: flex; flex-direction: column; gap: 1px; }
  .mname { font-size: var(--text-base); font-weight: 600; color: var(--ink); }
  .memail { font-size: var(--text-xs); color: var(--muted); }
  .signout {
    border: none; background: none; cursor: pointer; text-align: left;
    padding: 11px var(--space-3); border-radius: 9px; font-family: var(--font);
    font-size: var(--text-base); font-weight: 600; color: var(--crit);
  }
  .signout:hover { background: var(--crit-soft); }
  .signout:focus-visible { outline: 2px solid var(--crit); outline-offset: 2px; }

  /* Hamburger button — hidden on desktop */
  .hamburger {
    display: none;
    flex-direction: column; justify-content: center; align-items: center;
    gap: 5px;
    width: 40px; height: 40px;
    border: none; background: none; cursor: pointer; padding: var(--space-2);
    border-radius: var(--radius-xs);
    flex-shrink: 0;
  }
  .hamburger:hover { background: #F1EADB; }
  .hamburger:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
  .hamburger span {
    display: block; width: 20px; height: 2px;
    background: var(--ink-2); border-radius: 2px;
    transition: transform .18s ease, opacity .18s ease;
  }
  .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger.open span:nth-child(2) { opacity: 0; }
  .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile dropdown nav — only rendered in DOM when navOpen is true (Svelte {#if}) */
  .mobile-nav {
    position: sticky; top: 60px; z-index: 19;
    display: flex; flex-direction: column;
    background: var(--header); border-bottom: 1px solid var(--hair);
    padding: var(--space-2) clamp(var(--space-4), 4vw, var(--space-8));
    gap: var(--space-1);
  }
  .mobile-nav button {
    border: none; background: none; cursor: pointer; text-align: left;
    padding: var(--space-3) var(--space-3); border-radius: 10px;
    font-family: var(--font); font-size: var(--text-base); font-weight: 600; color: var(--ink-3);
    width: 100%;
  }
  .mobile-nav button:hover { background: #F1EADB; }
  .mobile-nav button.active { color: var(--ok); background: var(--accent-soft); }
  .mobile-nav button:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }

  @media (max-width: 640px) {
    header {
      gap: var(--space-2);
    }
    .left { gap: 0; }
    .desktop-nav { display: none; }
    .live { display: none; }
    .hamburger { display: flex; }
  }
</style>
