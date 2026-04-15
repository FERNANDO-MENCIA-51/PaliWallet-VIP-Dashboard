<script>
    import { ethers } from 'ethers';
    import { onMount, tick } from 'svelte';
    import Intro from './lib/Intro.svelte';
    import Wallet from './lib/Wallet.svelte';
    import Transfer from './lib/Transfer.svelte';
    import Networks from './lib/Networks.svelte';

    let address = '';
    let balance = '';
    let chainId = '';
    let error = '';
    let connected = false;
    let loading = false;
    let provider = /** @type {any} */ (null);
    let signer = /** @type {any} */ (null);

    /** @type {Array<{hash: string, to: string, amount: string, type: string, timestamp: string, chainId: string, explorerBase?: string}>} */
    let history = [];
    let activeTab = 'intro';

    const tabs = [
        { id: 'intro', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'wallet', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: 'transfer', label: 'Transferir', icon: 'M5 13l4 4L19 7M4 7h16M4 17h7' },
        { id: 'networks', label: 'Gestor de Redes', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    ];

    onMount(() => {
        animateLayout();
        tryAutoReconnect(); 
    });

    // Cargar historial cuando cambie la dirección
    $: if (address) {
        loadHistory(address);
    }

    function loadHistory(addr) {
        const saved = localStorage.getItem(`pali_history_${addr.toLowerCase()}`);
        history = saved ? JSON.parse(saved) : [];
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

    function recordTransaction(tx) {
        if (!address) return;
        const newEntry = {
            ...tx,
            timestamp: new Date().toISOString(),
            chainId: chainId,
            explorerBase: getExplorerBase(chainId)
        };
        history = [newEntry, ...history];
        localStorage.setItem(`pali_history_${address.toLowerCase()}`, JSON.stringify(history));
    }

    function animateLayout() {
        const win = /** @type {any} */ (window);
        if (win.anime) {
            win.anime({
                targets: '.sidebar',
                translateX: [-280, 0],
                easing: 'easeOutExpo',
                duration: 1500
            });
            win.anime({
                targets: '.main-content',
                opacity: [0, 1],
                easing: 'linear',
                duration: 800,
                delay: 300
            });
        }
    }

    async function tryAutoReconnect() {
        const wasConnected = sessionStorage.getItem('pali_connected');
        if (!wasConnected) return;

        const ethereum = window['ethereum'];
        if (!ethereum) return;

        try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                provider = new ethers.BrowserProvider(ethereum);
                signer = await provider.getSigner();
                address = await signer.getAddress();
                const rawBalance = await provider.getBalance(address);
                balance = ethers.formatEther(rawBalance);
                const network = await provider.getNetwork();
                chainId = network.chainId.toString();

                setupListeners(ethereum);
                connected = true;
                changeTab('wallet');
            } else {
                sessionStorage.removeItem('pali_connected');
            }
        } catch (err) {
            console.warn('Auto-reconnect failed:', err);
            sessionStorage.removeItem('pali_connected');
        }
    }

    function setupListeners(ethereum) {
        if (ethereum.on) {
            ethereum.on('chainChanged', handleChainChanged);
            ethereum.on('accountsChanged', handleAccountsChanged);
        }
    }

    function removeListeners() {
        const ethereum = window['ethereum'];
        if (ethereum?.removeListener) {
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    }

    async function changeTab(id) {
        if (!connected && id !== 'intro') return;
        activeTab = id;
        await tick();
        
        const win = /** @type {any} */ (window);
        if (win.anime) {
            win.anime({
                targets: '.content-glass',
                scale: [0.98, 1],
                opacity: [0, 1],
                easing: 'easeOutQuart',
                duration: 600
            });
        }
    }

    async function connectWallet() {
        error = ''; loading = true;
        try {
            const ethereum = window['ethereum'];
            if (!ethereum) { error = 'Pali Wallet no detectada.'; return; }
            
            await ethereum.request({ 
                method: 'wallet_requestPermissions', 
                params: [{ eth_accounts: {} }] 
            });

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) throw new Error('No se seleccionó ninguna cuenta.');

            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            const rawBalance = await provider.getBalance(address);
            balance = ethers.formatEther(rawBalance);

            const network = await provider.getNetwork();
            chainId = network.chainId.toString();

            setupListeners(ethereum);
            sessionStorage.setItem('pali_connected', 'true');

            connected = true;
            changeTab('wallet');
        } catch (err) {
            error = err.message || 'Error al conectar la wallet';
            console.error(err);
        } finally {
            loading = false;
        }
    }

    async function refreshBalance() {
        if (!address || !provider) return;
        try {
            const rawBalance = await provider.getBalance(address);
            balance = ethers.formatEther(rawBalance);
        } catch (err) {
            console.error('Error refreshing balance:', err);
        }
    }

    async function handleChainChanged(_chainHex) {
        try {
            const ethereum = window['ethereum'];
            if (!ethereum) return;

            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();

            const network = await provider.getNetwork();
            chainId = network.chainId.toString();

            await refreshBalance();
        } catch (err) {
            console.error('Error handling chain change:', err);
        }
    }

    async function handleAccountsChanged(accounts) {
        if (!accounts || accounts.length === 0) {
            disconnect();
            return;
        }
        try {
            const ethereum = window['ethereum'];
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            await refreshBalance();
        } catch (err) {
            console.error('Error handling account change:', err);
        }
    }

    function disconnect() {
        removeListeners();
        address = ''; 
        balance = '0'; 
        chainId = ''; 
        connected = false;
        provider = null; 
        signer = null;
        history = [];
        sessionStorage.removeItem('pali_connected');
        changeTab('intro');
    }

    function shortAddress(addr) {
        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }
</script>

<div class="app-container bg-grid">
    <aside class="sidebar">
        <div class="sidebar-brand">
            <div class="logo-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M16 12h.01"/><path d="M2 10h20"/>
                </svg>
            </div>
            <div>
                <h2>Fernando VIP</h2>
                <span>Innovacion Blockchain</span>
            </div>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-title">Menu principal</div>
            <nav class="sidebar-nav">
                {#each tabs as tab}
                    <button 
                        class="nav-item {activeTab === tab.id ? 'active' : ''}"
                        on:click={() => changeTab(tab.id)}
                        disabled={!connected && tab.id !== 'intro'}
                    >
                        <span class="nav-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d={tab.icon}/>
                            </svg>
                        </span>
                        <span class="nav-label">{tab.label}</span>
                        {#if tab.id === activeTab}
                            <div class="active-indicator"></div>
                        {/if}
                    </button>
                {/each}
            </nav>
        </div>

        <div class="sidebar-footer">
            {#if connected}
                <div class="user-pill">
                    <div class="user-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="user-info">
                        <span class="addr">{shortAddress(address)}</span>
                        <span class="net-status"><span class="dot"></span> Online</span>
                    </div>
                    <button class="btn-disconnect-icon" on:click={disconnect} title="Desconectar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </button>
                </div>
            {:else}
                <button class="btn-connect-full" on:click={connectWallet} disabled={loading}>
                    {#if loading}
                        <span class="spinner"></span>
                    {:else}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        Conectar Wallet
                    {/if}
                </button>
            {/if}
        </div>
    </aside>

    <main class="main-content">
        <header class="topbar">
            <div class="topbar-title">
                <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
                <p class="breadcrumbs">System / <span>{tabs.find(t => t.id === activeTab)?.label}</span></p>
            </div>
            
            <div class="topbar-actions">
                {#if error}
                    <div class="error-badge">⚠️ Error conexión</div>
                {/if}
                <div class="time-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Sesión Activa
                </div>
            </div>
        </header>

        <div class="content-wrapper">
            <div class="content-glass">
                {#if activeTab === 'intro'}
                    <Intro />
                {:else if activeTab === 'wallet'}
                    <Wallet {balance} {address} {chainId} {history} />
                {:else if activeTab === 'transfer'}
                    <Transfer 
                        {signer} 
                        {connected} 
                        {balance}
                        {chainId}
                        explorerBase={getExplorerBase(chainId)}
                        onTransactionConfirmed={refreshBalance} 
                        onNewTransaction={recordTransaction}
                    />
                {:else if activeTab === 'networks'}
                    <Networks {chainId} />
                {/if}
            </div>
        </div>

        <footer class="app-footer">
            <div class="footer-left">
                <strong>Fernando VIP Dashboard</strong>
                <span>Proyecto de Innovacion Blockchain</span>
            </div>
            <div class="footer-right">
                <span>Version 1.0</span>
                <span>UI Profesional + Multi Red</span>
                <span>Actividad completada</span>
            </div>
        </footer>
    </main>
</div>

<style>
  :global(:root) {
    --bg-dark: #0a0c10;
    --sidebar-bg: rgba(13, 16, 21, 0.95);
    --panel: rgba(18, 22, 28, 0.6);
    --border: rgba(255, 255, 255, 0.05);
    --border-2: rgba(255, 255, 255, 0.1);
    
    --text: #ffffff;
    --muted: #8b949e;
    
    --accent: #00d08e;
    --accent-2: #4b5563;
    --accent-glow: rgba(0, 208, 142, 0.18);
    
    --platinum: #f0f6fc;
    --good: #00ffa3;
    --bad: #ff5555;
    --muted-2: #636c76;
    --shadow-soft: 0 4px 24px rgba(0,0,0,0.3);
  }

    :global(body) {
        margin: 0; padding: 0;
        font-family: 'Space Grotesk', 'IBM Plex Sans', system-ui, sans-serif;
    background: var(--bg-dark);
    color: var(--text);
    overflow: hidden;
  }

  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
  }

  .bg-grid::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.15; z-index: 0;
    background-image: 
        radial-gradient(var(--accent) 0.5px, transparent 0.5px);
    background-size: 30px 30px;
  }

    .sidebar {
        width: 290px;
        background: var(--sidebar-bg);
    backdrop-filter: blur(30px);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 10;
    box-shadow: 10px 0 30px rgba(0,0,0,0.5);
  }

    .sidebar-brand {
        padding: 2.25rem 1.6rem 1.6rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

    .sidebar-title {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted-2);
        padding: 0 1.6rem 0.75rem;
        font-weight: 700;
    }

    .sidebar-section {
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border);
    }

    .logo-circle {
        width: 46px; height: 46px;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px var(--accent-glow);
  }

  .sidebar-brand h2 { margin: 0; font-size: 1.3rem; font-weight: 800; color: #fff; font-family: 'Outfit', sans-serif; }
  .sidebar-brand span { font-size: 0.7rem; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }

    .sidebar-nav {
        flex: 1;
        padding: 0 1rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .nav-item {
        position: relative;
        display: flex; align-items: center; gap: 0.85rem;
        width: 100%; padding: 0.75rem 0.9rem;
        background: transparent; border: 1px solid transparent; border-radius: 12px;
        color: var(--muted); font-size: 0.9rem; font-weight: 600;
        cursor: pointer; transition: all 0.3s; text-align: left;
    }

  .nav-item:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.03);
    color: #fff;
  }

    .nav-item.active {
        color: var(--text);
        background: rgba(0, 255, 163, 0.08);
        border-color: rgba(0, 255, 163, 0.2);
        box-shadow: 0 0 20px rgba(0, 255, 163, 0.08);
    }

    .nav-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(240, 242, 246, 0.06);
        border: 1px solid rgba(240, 242, 246, 0.08);
        flex-shrink: 0;
    }

    .nav-label {
        font-weight: 600;
    }

  .nav-item:disabled { opacity: 0.2; cursor: not-allowed; }

  .active-indicator {
    position: absolute; left: 0; top: 25%; height: 50%; width: 3px;
    background: var(--accent); border-radius: 0 4px 4px 0;
    box-shadow: 0 0 15px var(--accent);
  }

  .sidebar-footer {
        margin-top: auto;
        padding: 2.2rem 1.5rem 2.4rem;
    border-top: 1px solid var(--border);
  }

  .btn-connect-full {
    width: 100%; padding: 0.9rem;
    background: #fff; border: none;
    color: #000; border-radius: 12px;
    font-weight: 800; font-size: 0.9rem;
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    cursor: pointer; transition: all 0.2s;
  }

  .btn-connect-full:hover:not(:disabled) {
    background: var(--accent);
    box-shadow: 0 0 20px var(--accent-glow);
    transform: translateY(-2px);
  }

  .user-pill {
    display: flex; align-items: center; gap: 0.8rem;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    padding: 0.8rem; border-radius: 16px;
  }

  .user-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(0, 255, 163, 0.1); border: 1px solid rgba(0, 255, 163, 0.2);
    display: flex; align-items: center; justify-content: center;
  }

  .user-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden; }
  .user-info .addr { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 600; color: var(--muted); }
  .user-info .net-status { font-size: 0.65rem; color: var(--muted); display: flex; align-items: center; gap: 0.3rem; font-weight: 600; text-transform: uppercase; }

  .user-info .net-status { font-size: 0.65rem; color: var(--muted); display: flex; align-items: center; gap: 0.3rem; font-weight: 600; text-transform: uppercase; }
  
  .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); animation: pulse 2s infinite; }

  .btn-disconnect-icon {
    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
    color: var(--bad); width: 34px; height: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all 0.2s;
  }
  .btn-disconnect-icon:hover { background: var(--bad); color: #fff; }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    background: radial-gradient(circle at 50% -20%, #161b22, transparent);
  }

  .topbar {
    height: 90px; padding: 0 3.5rem;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }

  .topbar-title h1 { margin: 0; font-size: 1.8rem; color: #fff; font-weight: 800; letter-spacing: -0.03em; font-family: 'Outfit', sans-serif; }
  .breadcrumbs { margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--muted); font-weight: 500; }
  .breadcrumbs span { color: var(--accent); }

  .topbar-actions { display: flex; align-items: center; gap: 1.2rem; }
  
  .error-badge { background: rgba(255,85,85,0.1); border: 1px solid rgba(255,85,85,0.2); color: var(--bad); padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; }
  
  .time-badge {
    display: flex; align-items: center; gap: 0.6rem;
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    padding: 0.5rem 1rem; border-radius: 10px;
    font-size: 0.8rem; color: var(--muted); font-weight: 600;
  }

  .content-wrapper {
    flex: 1;
    padding: 2.5rem 3.5rem;
    overflow-y: auto;
  }

  .content-glass {
    background: var(--panel);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border-2);
    border-radius: 32px;
    padding: 3rem;
    min-height: calc(100% - 3rem);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    position: relative;
  }

    .app-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.2rem 3.5rem 1.8rem;
        color: var(--muted);
        font-size: 0.8rem;
    }

    .footer-left {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .footer-left strong {
        color: var(--platinum);
        font-size: 0.95rem;
    }

    .footer-right {
        display: flex;
        gap: 1.2rem;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

  .spinner { width: 14px; height: 14px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.7s linear infinite; }

  @keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 1000px) {
    .sidebar { width: 80px; }
        .sidebar h2, .sidebar-brand span, .sidebar-title, .nav-label, .sidebar-footer .user-info { display: none; }
    .sidebar-brand, .sidebar-footer { justify-content: center; padding: 1.5rem 0.5rem; }
    .nav-item { justify-content: center; padding: 1rem; }
    .topbar { padding: 0 1.5rem; }
    .content-wrapper { padding: 1.5rem; }
        .app-footer { padding: 1rem 1.5rem 1.5rem; flex-direction: column; align-items: flex-start; gap: 0.6rem; }
  }
</style>
