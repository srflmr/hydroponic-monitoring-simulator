<svelte:head><title>Sign in · Kanopi</title></svelte:head>

<div class="login">
  <aside class="brand">
    <div class="logo">
      <span class="mark"><span class="leaf"></span></span>
      <span class="name">Kanopi</span>
    </div>
    <div class="pitch">
      <h1>Multi-zone hydroponic control, in one calm view.</h1>
      <p>Live sensor telemetry, automatic nutrient arbitration across zones, and a shared tank that always knows who needs feeding first.</p>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">3</span><span class="lbl">growing zones</span></div>
      <div class="stat"><span class="num">4</span><span class="lbl">monitored signals</span></div>
      <div class="stat"><span class="num">24/7</span><span class="lbl">arbitration</span></div>
    </div>
  </aside>

  <main class="form-wrap">
    <div class="form">
      <div class="intro">
        <span class="h">Sign in</span>
        <span class="s">Operator access to Greenhouse-01</span>
      </div>
      <div class="note">
        <span class="ndot"></span>
        <span>Protected by Authelia · forwardAuth via Traefik</span>
      </div>
      <a class="sign-in-btn" href="/">Sign in</a>
    </div>
  </main>
</div>

<style>
  .login { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }

  .brand {
    background: var(--forest); color: #EFEAD9;
    padding: clamp(36px, 5vw, 56px) clamp(28px, 5vw, 64px);
    display: flex; flex-direction: column; justify-content: space-between; gap: 36px;
  }
  .logo { display: flex; align-items: center; gap: 14px; }
  .mark { width: 46px; height: 46px; border-radius: 15px; background: var(--water); display: flex; align-items: center; justify-content: center; }
  .leaf { width: 15px; height: 15px; border-radius: 50% 50% 50% 0; background: var(--forest); transform: rotate(45deg); }
  .name { font-size: 22px; font-weight: 700; }
  .pitch { display: flex; flex-direction: column; gap: 18px; max-width: 420px; }
  .pitch h1 { margin: 0; font-size: clamp(28px, 3.4vw, 38px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; }
  .pitch p { margin: 0; font-size: 16px; color: #B7C0A4; line-height: 1.5; }
  .stats { display: flex; gap: 28px; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: 2px; }
  .num { font-family: var(--mono); font-size: 24px; font-weight: 700; color: #9ED27A; }
  .lbl { font-size: 13px; color: #B7C0A4; }

  .form-wrap { display: flex; align-items: center; justify-content: center; padding: clamp(32px, 5vw, 48px) clamp(24px, 5vw, 48px); background: var(--cream); }
  .form { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 26px; }
  .intro { display: flex; flex-direction: column; gap: 7px; }
  .intro .h { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
  .intro .s { font-size: 15px; color: var(--ink-3); }
  .sign-in-btn {
    display: block; text-align: center; text-decoration: none;
    border: none; cursor: pointer; padding: 15px; border-radius: var(--radius-sm);
    background: var(--nutrient); color: var(--header);
    font-family: var(--font); font-size: 15px; font-weight: 700; letter-spacing: .02em;
    box-shadow: inset 0 -3px 0 rgba(0,0,0,.1);
  }
  .sign-in-btn:hover { background: var(--nutrient-strong); }
  .note { display: flex; align-items: center; gap: 8px; justify-content: center; }
  .ndot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .note span:last-child { font-size: 13px; color: var(--muted); }

  @media (max-width: 900px) {
    .login { grid-template-columns: 1fr; }
  }
</style>
