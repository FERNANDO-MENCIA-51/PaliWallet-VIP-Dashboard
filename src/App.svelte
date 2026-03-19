<script>
  import { ethers } from 'ethers'

  let address = ''
  let balance = ''
  let error = ''
  let connected = false
  let loading = false
  let copied = false

  async function requestPermissionsIfSupported() {
    if (!window.ethereum?.request) return
    // Some wallets will show a permissions modal even if already connected.
    // Fallback safely if unsupported.
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })
    } catch {
      // ignore
    }
  }

  async function revokePermissionsIfSupported() {
    if (!window.ethereum?.request) return
    try {
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      })
    } catch {
      // ignore
    }
  }

  async function connectWallet() {
    error = ''
    loading = true
    try {
      if (!window.ethereum) {
        error = 'Pali Wallet no detectada. Instálala como extensión del navegador.'
        return
      }
      await requestPermissionsIfSupported()
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      address = await signer.getAddress()
      const rawBalance = await provider.getBalance(address)
      balance = ethers.formatEther(rawBalance)
      connected = true
    } catch (err) {
      error = err.message || 'Error al conectar la wallet'
    } finally {
      loading = false
    }
  }

  function disconnect() {
    address = ''
    balance = ''
    connected = false
    // Best-effort: try to revoke permissions so next connect prompts again (if supported).
    revokePermissionsIfSupported()
  }

  function shortAddress(addr) {
    return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : ''
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(address)
    copied = true
    setTimeout(() => copied = false, 2000)
  }
</script>

<div class="bg">
  <div class="card">

    <div class="header">
      <div class="brand">
        <div class="logo-circle" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.92)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M16 12h.01"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>Pali Wallet</h1>
          <p class="subtitle">Conecta tu wallet y gestiona tus activos en la blockchain</p>
        </div>
      </div>

      {#if connected}
        <div class="connected-badge">
          <span class="dot"></span>
          Conectado
        </div>
      {/if}
    </div>

    {#if !connected}
      <!-- PANTALLA LOGIN -->
      <div class="divider"></div>

      <div class="trust-row appear appear-1">
        <div class="trust-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Seguro</span>
        </div>
        <div class="trust-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span>Rápido</span>
        </div>
        <div class="trust-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
          <span>Web3</span>
        </div>
        <div class="trust-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span>Privado</span>
        </div>
      </div>

      <button class="btn-connect appear appear-2" on:click={connectWallet} disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
          <span>Conectando...</span>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span>Iniciar sesión con Pali Wallet</span>
        {/if}
      </button>

    {:else}
      <!-- PANTALLA CONECTADO -->
      <div class="dash-grid">
        <div class="dash-balance appear appear-1">
          <div class="balance-card">
            <div class="bc-shine"></div>
            <div class="bc-shine2"></div>
            <div class="bc-top">
              <div class="bc-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.82)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <span class="bc-label">Saldo disponible</span>
            </div>
            <p class="bc-amount">{parseFloat(balance).toFixed(4)}</p>
            <p class="bc-sym">SYS · Syscoin Network</p>
            <div class="bc-footer">
              <div class="bc-dots">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
              <span class="bc-last4">{address.slice(-4).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div class="dash-kpi appear appear-2">
          <div class="info-box">
            <div class="info-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p class="info-label">Dirección</p>
              <p class="info-value mono">{shortAddress(address)}</p>
            </div>
          </div>
        </div>

        <div class="dash-kpi appear appear-3">
          <div class="info-box">
            <div class="info-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(207, 210, 218, 0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
            </div>
            <div>
              <p class="info-label">Saldo</p>
              <p class="info-value mono">{parseFloat(balance).toFixed(6)} SYS</p>
            </div>
          </div>
        </div>

        <div class="dash-wide appear appear-4">
          <button class="address-box" on:click={copyAddress}>
            <div class="addr-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.55)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <div>
                <p class="info-label">Address completo</p>
                <p class="addr-text mono">{address}</p>
              </div>
            </div>
            <div class="copy-icon">
              {#if copied}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {:else}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.55)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              {/if}
            </div>
          </button>
        </div>

        <div class="dash-network appear appear-5">
          <div class="network-box">
            <div class="network-dot"></div>
            <div>
              <p class="info-label">Red activa</p>
              <p class="info-value">Syscoin Network</p>
            </div>
            <div class="network-badge">Mainnet</div>
          </div>
        </div>

        <div class="dash-action appear appear-6">
          <button class="btn-disconnect" on:click={disconnect}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Desconectar
          </button>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {error}
      </div>
    {/if}

  </div>
</div>

<style>
  :global(:root) {
    --bg: #14181f;
    --panel: rgba(18, 22, 29, 0.78);
    --panel-solid: #12161d;
    --panel-2: rgba(20, 24, 32, 0.62);
    --border: rgba(233, 234, 238, 0.10);
    --border-2: rgba(233, 234, 238, 0.16);
    --text: rgba(235, 237, 242, 0.94);
    --muted: rgba(235, 237, 242, 0.62);
    --muted-2: rgba(235, 237, 242, 0.42);

    --platinum: #f0f2f6;
    --platinum-2: rgba(240, 242, 246, 0.78);
    --steel: rgba(221, 225, 234, 0.16);
    --steel-2: rgba(221, 225, 234, 0.10);

    --good: #3ddc97;
    --bad: #ff6b6b;

    --shadow: 0 26px 90px rgba(0, 0, 0, 0.55);
    --shadow-soft: 0 16px 40px rgba(0, 0, 0, 0.35);
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
  }

  .bg {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }

  .bg::before {
    content: '';
    position: absolute;
    inset: -2px;
    pointer-events: none;
    opacity: 0.35;
    background:
      repeating-linear-gradient(90deg, rgba(221,225,234,0.06) 0 1px, transparent 1px 44px),
      repeating-linear-gradient(0deg, rgba(221,225,234,0.04) 0 1px, transparent 1px 44px);
    transform: translateZ(0);
    animation: gridDrift 18s linear infinite;
  }

  .bg::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(1200px 700px at 50% 0%, rgba(240,242,246,0.22), transparent 58%),
      radial-gradient(900px 700px at 50% 120%, rgba(0,0,0,0.42), transparent 52%);
    opacity: 1;
  }

  .card {
    position: relative;
    z-index: 1;
    background: var(--panel);
    backdrop-filter: blur(18px);
    border: 1px solid rgba(221, 225, 234, 0.12);
    border-radius: 28px;
    padding: 2.5rem 2.75rem;
    width: 100%;
    max-width: 780px;
    text-align: center;
    color: var(--text);
    box-shadow: var(--shadow);
    animation: popIn 560ms cubic-bezier(.2,.9,.2,1) both;
  }

  .card::before {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 22px;
    border: 1px solid rgba(221, 225, 234, 0.08);
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
  }

  .brand-text { text-align: left; min-width: 0; }

  .logo-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(240, 242, 246, 0.12);
    border: 1px solid rgba(240, 242, 246, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: none;
    flex: 0 0 auto;
  }

  h1 {
    font-size: 1.35rem;
    font-weight: 800;
    margin: 0 0 0.15rem;
    color: var(--platinum);
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 0.88rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.6;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 1.5rem;
  }

  /* Trust row */
  .trust-row {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.75rem;
  }

  .trust-item {
    flex: 1;
    display: grid;
    grid-template-columns: 20px 1fr;
    align-items: center;
    gap: 0.55rem;
    padding: 0.75rem 0.85rem;
    border-radius: 14px;
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid rgba(240, 242, 246, 0.10);
    color: var(--muted);
    font-size: 0.72rem;
    letter-spacing: 0.03em;
  }

  .trust-item span { justify-self: start; }

  /* Botón conectar */
  .btn-connect {
    width: 100%;
    padding: 0.95rem 1.5rem;
    background: rgba(240, 242, 246, 0.10);
    color: var(--platinum);
    border: 1px solid rgba(240, 242, 246, 0.22);
    border-radius: 14px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    transition: transform 0.15s, background 0.2s, border-color 0.2s, box-shadow 0.2s;
    box-shadow: none;
    letter-spacing: 0.01em;
  }

  .btn-connect:hover:not(:disabled) {
    transform: translateY(-2px);
    background: rgba(240, 242, 246, 0.14);
    border-color: rgba(240, 242, 246, 0.32);
    box-shadow: 0 12px 34px rgba(0,0,0,0.28);
  }

  .btn-connect:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Badge conectado */
  .connected-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(61, 220, 151, 0.10);
    border: 1px solid rgba(61, 220, 151, 0.22);
    border-radius: 20px;
    padding: 0.3rem 0.85rem;
    font-size: 0.75rem;
    color: var(--good);
    font-weight: 600;
    letter-spacing: 0.04em;
    margin: 0;
    animation: fadeUp 520ms cubic-bezier(.2,.9,.2,1) both;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--good);
    box-shadow: none;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Balance card */
  .balance-card {
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid rgba(240, 242, 246, 0.16);
    border-radius: 20px;
    padding: 1.75rem;
    flex: 1;
    position: relative;
    overflow: hidden;
    text-align: left;
    box-shadow: var(--shadow-soft);
    transform: translateZ(0);
    animation: cardFloat 8.5s ease-in-out infinite;
  }

  .bc-shine {
    display: block;
    position: absolute;
    inset: -2px;
    border-radius: 20px;
    pointer-events: none;
    background:
      repeating-linear-gradient(135deg, rgba(240,242,246,0.10) 0 1px, transparent 1px 12px);
    opacity: 0.55;
    mask: linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.15));
    animation: scan 7.5s linear infinite;
  }

  .bc-shine2 {
    display: block;
    position: absolute;
    inset: 10px;
    border-radius: 14px;
    border: 1px solid rgba(221, 225, 234, 0.10);
    pointer-events: none;
  }

  .balance-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    pointer-events: none;
    background:
      radial-gradient(640px 260px at 22% 8%, rgba(240,242,246,0.18), transparent 58%),
      radial-gradient(560px 280px at 92% 86%, rgba(240,242,246,0.10), transparent 62%);
    opacity: 0.9;
  }

  .balance-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    pointer-events: none;
    box-shadow: inset 0 1px 0 rgba(240,242,246,0.18), inset 0 -1px 0 rgba(0,0,0,0.35);
  }

  .bc-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .bc-icon {
    width: 32px; height: 32px;
    background: rgba(240, 242, 246, 0.10);
    border: 1px solid rgba(240, 242, 246, 0.16);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }

  .bc-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .bc-amount {
    margin: 0;
    font-size: 3rem;
    font-weight: 800;
    color: var(--platinum);
    letter-spacing: -1px;
    line-height: 1;
  }

  .bc-sym {
    margin: 0.3rem 0 1.25rem;
    font-size: 0.8rem;
    color: var(--muted);
    font-weight: 500;
  }

  .bc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bc-dots { display: flex; gap: 5px; }
  .bc-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(233, 234, 238, 0.22);
  }

  .bc-last4 {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--muted);
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  /* Layout dos columnas */
  .wallet-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    text-align: left;
  }

  .col-left {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .col-right {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Info grid */
  .info-box {
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-align: left;
    transition: background 0.2s, border-color 0.2s;
  }

  .info-box:hover {
    background: rgba(240, 242, 246, 0.09);
    border-color: var(--border-2);
  }

  .info-icon-wrap {
    width: 34px; height: 34px;
    background: rgba(240, 242, 246, 0.08);
    border: 1px solid rgba(240, 242, 246, 0.12);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .info-label {
    font-size: 0.68rem;
    color: var(--muted-2);
    margin: 0 0 3px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .info-value {
    font-size: 1rem;
    color: var(--text);
    margin: 0;
    font-weight: 700;
  }

  /* Network box */
  .network-box {
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .network-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--good);
    box-shadow: none;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .network-badge {
    margin-left: auto;
    background: rgba(61, 220, 151, 0.10);
    border: 1px solid rgba(61, 220, 151, 0.18);
    border-radius: 20px;
    padding: 0.2rem 0.65rem;
    font-size: 0.7rem;
    color: var(--good);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  /* Address box */
  .address-box {
    width: 100%;
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 0.9rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    text-align: left;
    color: var(--text);
    box-sizing: border-box;
  }

  .address-box:hover {
    background: rgba(240, 242, 246, 0.09);
    border-color: rgba(240, 242, 246, 0.22);
  }

  .dash-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 0.9rem;
    text-align: left;
  }

  .dash-balance { grid-column: 1 / 2; grid-row: 1 / span 3; }
  .dash-kpi { grid-column: 2 / 3; }
  .dash-wide { grid-column: 1 / -1; }
  .dash-network { grid-column: 1 / 2; }
  .dash-action { grid-column: 2 / 3; }

  @media (max-width: 820px) {
    .dash-grid { grid-template-columns: 1fr; }
    .dash-balance, .dash-kpi, .dash-wide, .dash-network, .dash-action { grid-column: 1 / -1; grid-row: auto; }
  }

  .appear {
    animation: fadeUp 520ms cubic-bezier(.2,.9,.2,1) both;
    will-change: transform, opacity;
  }
  .appear-1 { animation-delay: 60ms; }
  .appear-2 { animation-delay: 120ms; }
  .appear-3 { animation-delay: 180ms; }
  .appear-4 { animation-delay: 240ms; }
  .appear-5 { animation-delay: 300ms; }
  .appear-6 { animation-delay: 360ms; }

  .addr-left {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
  }

  .addr-left svg { flex-shrink: 0; margin-top: 2px; }

  .addr-text {
    font-size: 0.68rem;
    color: var(--muted);
    word-break: break-all;
    margin: 0;
    line-height: 1.5;
  }

  .copy-icon { flex-shrink: 0; }

  /* Botón desconectar */
  .btn-disconnect {
    width: 100%;
    padding: 0.8rem;
    background: transparent;
    color: var(--bad);
    border: 1px solid rgba(255, 107, 107, 0.35);
    border-radius: 14px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.2s, border-color 0.2s;
    letter-spacing: 0.01em;
  }

  .btn-disconnect:hover {
    background: rgba(255, 107, 107, 0.08);
    border-color: rgba(255, 107, 107, 0.55);
  }

  /* Error */
  .error-box {
    margin-top: 1rem;
    background: rgba(255, 107, 107, 0.10);
    border: 1px solid rgba(255, 107, 107, 0.22);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    color: rgba(255, 107, 107, 0.92);
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
  }

  .mono { font-family: 'Courier New', monospace; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(233, 234, 238, 0.22);
    border-top-color: var(--platinum);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes cardFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }

  @keyframes scan {
    0% { transform: translateX(-22px) translateY(-10px); opacity: 0.45; }
    50% { opacity: 0.62; }
    100% { transform: translateX(22px) translateY(10px); opacity: 0.45; }
  }

  @keyframes gridDrift {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-44px, -44px, 0); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes popIn {
    from { opacity: 0; transform: translateY(14px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .balance-card, .bg::before { animation: none !important; }
    .btn-connect, .info-box, .address-box { transition: none !important; }
    .appear, .card, .connected-badge { animation: none !important; }
  }
</style>
