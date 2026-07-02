<svelte:head><title>Sign in · HMS</title></svelte:head>

<div class="login">
  <aside class="brand">
    <div class="logo">
      <span class="mark"><span class="leaf"></span></span>
      <span class="name">HMS</span>
    </div>
    <div class="pitch">
      <h1>Hydroponic Monitoring System Simulator</h1>
      <p>Live sensor telemetry and automatic nutrient arbitration across zones, from one shared tank that always knows who to feed first.</p>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">2</span><span class="lbl">growing zones</span></div>
      <div class="stat"><span class="num">4</span><span class="lbl">monitored signals</span></div>
      <div class="stat"><span class="num">24/7</span><span class="lbl">arbitration</span></div>
    </div>
  </aside>

  <main class="form-wrap">
    <div class="form">
      <div class="intro">
        <span class="h">Sign in</span>
        <span class="s">Operator access to the monitoring console</span>
      </div>
      <div class="note">
        <span class="ndot"></span>
        <span>You'll sign in on the secure Authelia portal</span>
      </div>
      <a class="sign-in-btn" href="/dashboard" data-sveltekit-reload>Sign in</a>
    </div>
  </main>
</div>

<style>
  .login { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }

  .brand {
    background: var(--forest); color: #EFEAD9;
    padding: clamp(var(--space-10), 5vw, 56px) clamp(var(--space-8), 5vw, 64px);
    display: flex; flex-direction: column; justify-content: space-between; gap: var(--space-10);
  }
  .logo { display: flex; align-items: center; gap: var(--space-3); }
  .mark { width: 46px; height: 46px; border-radius: 15px; background: var(--water); display: flex; align-items: center; justify-content: center; }
  .leaf { width: 15px; height: 15px; border-radius: 50% 50% 50% 0; background: var(--forest); transform: rotate(45deg); }
  .name { font-size: var(--text-lg); font-weight: 700; }
  .pitch { display: flex; flex-direction: column; gap: var(--space-4); max-width: 420px; }
  .pitch h1 { margin: 0; font-size: clamp(var(--text-2xl), 3.4vw, 38px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; }
  .pitch p { margin: 0; font-size: var(--text-md); color: #B7C0A4; line-height: 1.5; }
  .stats { display: flex; gap: var(--space-8); flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: var(--space-1); }
  .num { font-family: var(--mono); font-size: var(--text-xl); font-weight: 700; color: #9ED27A; }
  .lbl { font-size: var(--text-sm); color: #B7C0A4; }

  .form-wrap { display: flex; align-items: center; justify-content: center; padding: clamp(var(--space-8), 5vw, 48px) clamp(var(--space-6), 5vw, 48px); background: var(--cream); }
  .form { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: var(--space-6); }
  .intro { display: flex; flex-direction: column; gap: 7px; }
  .intro .h { font-size: var(--text-xl); font-weight: 700; letter-spacing: -.01em; }
  .intro .s { font-size: var(--text-md); color: var(--ink-3); }
  .sign-in-btn {
    display: block; text-align: center; text-decoration: none;
    border: none; cursor: pointer; padding: 15px; border-radius: var(--radius-sm);
    background: var(--nutrient); color: var(--header);
    font-family: var(--font); font-size: var(--text-md); font-weight: 700; letter-spacing: .02em;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.1);
  }
  .sign-in-btn:hover { background: var(--nutrient-strong); }
  .note { display: flex; align-items: center; gap: var(--space-2); justify-content: center; }
  .ndot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .note span:last-child { font-size: var(--text-sm); color: var(--muted); }

  @media (max-width: 900px) {
    .login { grid-template-columns: 1fr; }
  }
</style>
