<script>
    import { fade } from 'svelte/transition';

    export let balance = '';
    export let address = '';
    export let chainId = '';
    /** @type {Array<any>} */
    export let history = [];
    
    let copied = false;
    $: txCount = history.length;
    $: lastTx = history[0];
    $: lastActivity = lastTx ? new Date(lastTx.timestamp).toLocaleString() : 'Sin actividad';
    $: totalSent = history.reduce((sum, tx) => sum + (tx.type === 'Sent' ? Number(tx.amount || 0) : 0), 0);
    $: totalSentLabel = Number.isNaN(totalSent) ? '0.0000' : totalSent.toFixed(4);

    function shortAddress(addr) {
        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }

    function getExplorerBase(id) {
      switch (id) {
        case '570':
          return 'https://explorer.rollux.com/tx/';
        case '57000':
          return 'https://rollux.tanenbaum.io/tx/';
        case '57':
          return 'https://explorer.syscoin.org/tx/';
        case '5700':
          return 'https://explorer.tanenbaum.io/tx/';
        case '57042':
          return 'https://explorer-pob.dev11.top/tx/';
        case '57057':
          return 'https://explorer-zk.tanenbaum.io/tx/';
        case '1':
          return 'https://etherscan.io/tx/';
        case '11155111':
          return 'https://sepolia.etherscan.io/tx/';
        case '137':
          return 'https://polygonscan.com/tx/';
        case '56':
          return 'https://bscscan.com/tx/';
        case '43114':
          return 'https://snowtrace.io/tx/';
        default:
          return 'https://explorer.syscoin.org/tx/';
      }
    }

    async function copyAddress() {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
</script>

<div class="dash-container" in:fade={{ duration: 400 }}>
    <header class="dash-section-header appear">
        <div class="welcome-box">
            <span class="hi">👋</span>
            <div>
                <h2>Mi Billetera</h2>
                <p>Bienvenido de nuevo a tu panel VIP</p>
            </div>
        </div>
    </header>

    <div class="overview-grid appear appear-1">
      <div class="overview-card">
        <div class="overview-icon">📊</div>
        <div>
          <p class="overview-label">Actividad total</p>
          <p class="overview-value">{txCount} transacciones</p>
          <p class="overview-sub">Ultima: {lastActivity}</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">💸</div>
        <div>
          <p class="overview-label">Total enviado</p>
          <p class="overview-value">{totalSentLabel}</p>
          <p class="overview-sub">Solo salidas registradas</p>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">🌐</div>
        <div>
          <p class="overview-label">Red activa</p>
          <p class="overview-value">{chainId ? `Chain ID ${chainId}` : 'No conectada'}</p>
          <p class="overview-sub">Wallet sincronizada</p>
        </div>
      </div>
    </div>

    <div class="dash-grid">
        <!-- Columna Izquierda: Tarjeta de Saldo -->
        <div class="dash-left">
            <div class="dash-balance-wrap appear appear-1">
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
                    <div class="bc-body">
                        <p class="bc-amount">{parseFloat(balance || '0').toFixed(4)}</p>
                        <p class="bc-sym">SYS / ETH</p>
                    </div>
                    <div class="bc-footer">
                        <div class="bc-dots">
                            <span></span><span></span><span></span><span></span>
                            <span></span><span></span><span></span><span></span>
                        </div>
                        <span class="bc-last4">{address ? address.slice(-4).toUpperCase() : '----'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Columna Derecha: KPI Boxes -->
        <div class="dash-right">
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
                        <p class="info-value mono">{shortAddress(address) || '---'}</p>
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
                        <p class="info-value mono">{parseFloat(balance || '0').toFixed(6)}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filas de Ancho Completo -->
        <div class="dash-full-rows">
            <div class="dash-wide appear appear-4">
                <button class="address-box" on:click={copyAddress}>
                    <div class="addr-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.55)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                        <div>
                            <p class="info-label">Address completo</p>
                            <p class="addr-text mono">{address || 'No detectada'}</p>
                        </div>
                    </div>
                    <div class="copy-icon">
                        {#if copied}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {:else}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 237, 242, 0.55)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        {/if}
                    </div>
                </button>
            </div>

            <div class="dash-network appear appear-5">
                <div class="network-box">
                    <div class="network-dot"></div>
                    <div>
                        <p class="info-label">Red activa</p>
                        <p class="info-value">{chainId ? `Chain ID ${chainId}` : 'Desconocida'}</p>
                    </div>
                    <div class="network-badge">{chainId ? (chainId === '5700' || chainId === '57' ? 'Syscoin' : 'Otra/EVM') : 'N/A'}</div>
                </div>
            </div>

            <!-- Historial de Transacciones (Solo si hay) -->
            {#if history.length > 0}
                <div class="dash-history appear appear-6">
                    <div class="history-container">
                        <div class="history-header">
                            <h3>Historial Reciente</h3>
                            <div class="header-right">
                                <span class="count-badge">{history.length} txn</span>
                            </div>
                        </div>
                        
                        <div class="history-list">
                            {#each history as tx}
                                <div class="history-item">
                                    <div class="tx-icon {tx.type.toLowerCase()}">
                                        {#if tx.type === 'Sent'}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                                        {/if}
                                    </div>
                                    <div class="tx-info">
                                        <div class="tx-main">
                                            <span class="tx-type">{tx.type}</span>
                                            <span class="tx-to">A: {shortAddress(tx.to)}</span>
                                        </div>
                                        <div class="tx-sub">
                                            <span class="tx-hash mono">{tx.hash.slice(0, 10)}...</span>
                                            <span class="tx-date">{new Date(tx.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div class="tx-values">
                                        <div class="tx-amount">-{tx.amount}</div>
                                        <div class="tx-chain">ID {tx.chainId}</div>
                                    </div>
                                    <a href={(tx.explorerBase || getExplorerBase(tx.chainId)) + tx.hash} target="_blank" class="tx-link" title="Ver en Explorer">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
  /* Balance card */
  .balance-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 2rem;
    width: 100%;
    max-width: 440px;
    aspect-ratio: 1.6 / 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    box-shadow: 
        0 20px 40px rgba(0,0,0,0.3),
        inset 0 1px 1px rgba(255,255,255,0.1);
    transform: translateZ(0);
    animation: cardFloat 8.5s ease-in-out infinite;
  }

  .bc-shine {
    display: block;
    position: absolute;
    inset: -2px;
    border-radius: 20px;
    pointer-events: none;
    background: repeating-linear-gradient(135deg, rgba(240,242,246,0.10) 0 1px, transparent 1px 12px);
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
    background: radial-gradient(640px 260px at 22% 8%, rgba(240,242,246,0.18), transparent 58%),
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

  .bc-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
  .bc-icon {
    width: 32px; height: 32px;
    background: rgba(240, 242, 246, 0.10);
    border: 1px solid rgba(240, 242, 246, 0.16);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .bc-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .bc-amount { margin: 0; font-size: 3rem; font-weight: 800; color: var(--platinum); letter-spacing: -1px; line-height: 1; }
  .bc-sym { margin: 0.3rem 0 1.25rem; font-size: 0.8rem; color: var(--muted); font-weight: 500; }
  .bc-footer { display: flex; align-items: center; justify-content: space-between; }
  .bc-dots { display: flex; gap: 5px; }
  .bc-dots span { width: 6px; height: 6px; border-radius: 50%; background: rgba(233, 234, 238, 0.22); }
  .bc-last4 { font-family: monospace; font-size: 0.85rem; color: var(--muted); font-weight: 600; letter-spacing: 0.1em; }

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
    height: 100%;
    box-sizing: border-box;
  }
  .info-box:hover { background: rgba(240, 242, 246, 0.09); border-color: var(--border-2); }
  .info-icon-wrap {
    width: 34px; height: 34px;
    background: rgba(240, 242, 246, 0.08);
    border: 1px solid rgba(240, 242, 246, 0.12);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .info-label { font-size: 0.68rem; color: var(--muted-2); margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.07em; }
  .info-value { font-size: 1rem; color: var(--text); margin: 0; font-weight: 700; }

  /* Network box */
  .network-box {
    background: rgba(240, 242, 246, 0.06);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 100%;
    box-sizing: border-box;
  }
  .network-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--good); box-shadow: none; flex-shrink: 0; animation: pulse 2s infinite; }
  .network-badge {
    margin-left: auto;
    background: rgba(0, 208, 142, 0.10);
    border: 1px solid rgba(0, 208, 142, 0.18);
    border-radius: 20px;
    padding: 0.2rem 0.65rem;
    font-size: 0.7rem;
    color: var(--good);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .address-box:hover { background: rgba(240, 242, 246, 0.09); border-color: rgba(240, 242, 246, 0.22); }
  
  .dash-container { 
    display: flex; 
    flex-direction: column; 
    gap: 1.5rem; 
    max-width: 1200px;
    margin: 0 auto;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .overview-card {
    background: rgba(240, 242, 246, 0.05);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .overview-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(0, 208, 142, 0.12);
    border: 1px solid rgba(0, 208, 142, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .overview-label {
    margin: 0 0 0.2rem;
    font-size: 0.7rem;
    color: var(--muted-2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .overview-value {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--platinum);
  }

  .overview-sub {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }

  @media (max-width: 900px) {
    .overview-grid {
        grid-template-columns: 1fr;
    }
  }

  .dash-section-header { 
    width: 100%; 
  }

  .dash-grid { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 1.5rem; 
    align-items: start;
  }

  .dash-left {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dash-right {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;
  }

  .dash-full-rows {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dash-balance-wrap {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }

  /* Info boxes within right column */
  .dash-kpi {
    width: 100%;
  }

  .dash-wide, .dash-network, .dash-history {
    width: 100%;
  }

  /* Card body adjustment */
  .bc-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
  
  .dash-full { grid-column: 1 / -1; }

  /* Welcome Header */
  .welcome-box {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 0.5rem 0 2rem;
  }
  .hi { font-size: 2.2rem; }
  .welcome-box h2 { 
    margin: 0; 
    font-size: 1.5rem; 
    font-weight: 800; 
    color: var(--platinum); 
    font-family: 'Outfit', sans-serif;
  }
  .welcome-box p { 
    margin: 3px 0 0; 
    font-size: 0.85rem; 
    color: var(--muted); 
  }

  /* History styles */
  .history-container {
    background: rgba(240, 242, 246, 0.04);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.5rem;
    margin-top: 0.5rem;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
  }

  .history-header h3 { margin: 0; font-size: 1.1rem; color: var(--platinum); }
  .header-right { display: flex; align-items: center; gap: 1rem; }
  .count-badge { font-size: 0.7rem; background: rgba(255, 255, 255, 0.05); padding: 0.3rem 0.6rem; border-radius: 8px; color: var(--muted); }
  
  .btn-clear {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
    font-size: 0.7rem;
    padding: 0.3rem 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
  }
  .btn-clear:hover { background: #ff6b6b; color: #fff; }

  .history-list { display: flex; flex-direction: column; gap: 0.8rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }
  
  .history-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border);
    border-radius: 14px;
    transition: all 0.2s;
  }

  .history-item:hover { background: rgba(255, 255, 255, 0.04); border-color: var(--border-2); }

  .tx-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tx-icon.sent { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; }

  .tx-info { flex: 1; min-width: 0; }
  .tx-main { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
  .tx-type { font-weight: 700; color: var(--platinum); font-size: 0.95rem; }
  .tx-to { font-size: 0.85rem; color: var(--muted); }
  
  .tx-sub { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--muted-2); }
  
  .tx-values { text-align: right; flex-shrink: 0; }
  .tx-amount { font-family: 'Courier New', monospace; font-weight: 700; color: #ff6b6b; font-size: 1rem; }
  .tx-chain { font-size: 0.65rem; color: var(--muted-2); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

  .tx-link {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: all 0.2s;
  }
  .tx-link:hover { background: var(--accent); color: #000; }

  .empty-state { padding: 3rem; text-align: center; color: var(--muted-2); font-size: 0.9rem; }

  @media (max-width: 820px) {
    .dash-grid { grid-template-columns: 1fr; }
    .dash-left, .dash-right, .dash-full-rows { grid-column: 1 / -1; }
  }

  .appear { animation: fadeUp 520ms cubic-bezier(.2,.9,.2,1) both; will-change: transform, opacity; }
  .appear-1 { animation-delay: 60ms; }
  .appear-2 { animation-delay: 120ms; }
  .appear-3 { animation-delay: 180ms; }
  .appear-4 { animation-delay: 240ms; }
  .appear-5 { animation-delay: 300ms; }
  .appear-6 { animation-delay: 360ms; }

  .addr-left { display: flex; align-items: flex-start; gap: 0.6rem; flex: 1; min-width: 0; }
  .addr-left svg { flex-shrink: 0; margin-top: 2px; }
  .addr-text { font-size: 0.68rem; color: var(--muted); word-break: break-all; margin: 0; line-height: 1.5; }
  .copy-icon { flex-shrink: 0; }
  .mono { font-family: 'Courier New', monospace; }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes scan { 0% { transform: translateX(-22px) translateY(-10px); opacity: 0.45; } 50% { opacity: 0.62; } 100% { transform: translateX(22px) translateY(10px); opacity: 0.45; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cardFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
</style>
