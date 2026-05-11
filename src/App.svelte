<script>
    import { ethers } from 'ethers';

    // ABI mínima para balanceOf de un token ERC20
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    // Dirección del contrato TSYS
    const TOKEN_ADDRESS = "0x48e29Ec3a874FF754BE17D96dBE084dF54202B03";
    let tokenBalance = '';
    let tokenSymbol = 'TSYS';
    let tokenDecimals = 18;
    import { onMount, tick } from 'svelte';
    import { fade } from 'svelte/transition';
    import Intro from './lib/Intro.svelte';
    import Wallet from './lib/Wallet.svelte';
    import { getExplorerApiUrl, getExplorerBase, getNetworkName, getNetworkTicker, EVM_NETWORKS } from './lib/config/networks.js';
    import { fetchWithRetry } from './composables/retry.js';

    let address = '';
    let balance = '';
    let chainId = '';
    let error = '';
    let connected = false;
    let loading = false;
    /** @type {any} */
    let provider = null;
    /** @type {any} */
    let signer = null;

    /** @type {any[]} */
    let history = [];
    /** @type {any[]} */
    let localHistory = [];
    /** @type {any[]} */
    let tokenHistory = [];
    /** @type {any[]} */
    let explorerHistory = [];
    let tokenHistoryKey = '';
    let explorerHistoryKey = '';
    let activeTab = 'intro';
    let showNetworkDropdown = false;

    const tabs = [
        { id: 'intro', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'wallet', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }
    ];

    let showInitialLoader = true;

    onMount(() => {
        tryAutoReconnect(); 
        // 3.8s: Entrada directa en el pico del destello
        setTimeout(() => { showInitialLoader = false; }, 3800);
    });

    // Cuando cambie la dirección, consulta el balance del token
    $: if (address && provider) {
        loadTokenBalance();
    }

    $: if (address && provider && chainId) {
        const nextKey = `${address.toLowerCase()}_${chainId}`;
        if (tokenHistoryKey !== nextKey) {
            tokenHistoryKey = nextKey;
            loadTokenTransferHistory();
        }
    }

    $: if (address && chainId) {
        const nextKey = `${address.toLowerCase()}_${chainId}`;
        if (explorerHistoryKey !== nextKey) {
            explorerHistoryKey = nextKey;
            loadExplorerHistory();
        }
    }

    $: history = mergeHistory(localHistory, explorerHistory, tokenHistory);

    async function loadTokenBalance() {
        if (!provider) return;
        try {
            const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
            const [raw, decimals, symbol] = await Promise.all([
                contract.balanceOf(address),
                contract.decimals(),
                contract.symbol()
            ]);
            tokenDecimals = Number(decimals);
            tokenSymbol = symbol;
            tokenBalance = ethers.formatUnits(raw, decimals);
        } catch (err) {
            tokenBalance = '0';
        }
    }

    // Cargar historial cuando cambie la dirección
    $: if (address) {
        loadHistory(address);
    }

    /** @param {string} addr */
    function loadHistory(addr) {
        try {
            const saved = localStorage.getItem(`pali_history_${addr.toLowerCase()}`);
            const parsed = saved ? JSON.parse(saved) : [];
            localHistory = Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('No se pudo leer historial local:', err);
            localHistory = [];
        }
    }

    /** @param {any[][]} groups */
    function mergeHistory(...groups) {
        const seen = new Set();
        return groups.flat()
            .filter((tx) => {
                const key = `${tx.hash}_${tx.type}_${tx.assetSymbol || ''}_${tx.logIndex ?? ''}_${tx.amount}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    async function loadExplorerHistory() {
        if (!address || !chainId) return;

        const apiUrl = getExplorerApiUrl(chainId);
        if (!apiUrl) {
            explorerHistory = [];
            return;
        }

        try {
            const params = new URLSearchParams({
                module: 'account',
                action: 'txlist',
                address,
                sort: 'desc'
            });
            const response = await fetchWithRetry(`${apiUrl}?${params.toString()}`);
            if (!response.ok) throw new Error(`Explorer API ${response.status}`);

            const payload = await response.json();
            const rows = Array.isArray(payload?.result) ? payload.result : [];
            const account = address.toLowerCase();
            const ticker = getNetworkTicker(chainId);

            explorerHistory = rows
                .filter(/** @param {any} tx */(tx) => tx.hash && tx.value && tx.value !== '0')
                .map(/** @param {any} tx */(tx) => {
                    const from = tx.from || '';
                    const to = tx.to || '';
                    const isReceived = to.toLowerCase() === account;
                    return {
                        hash: tx.hash,
                        from,
                        to,
                        amount: ethers.formatEther(tx.value),
                        type: isReceived ? 'Received' : 'Sent',
                        timestamp: tx.timeStamp ? new Date(Number(tx.timeStamp) * 1000).toISOString() : new Date().toISOString(),
                        chainId,
                        networkName: getNetworkName(chainId),
                        explorerBase: getExplorerBase(chainId),
                        assetSymbol: ticker,
                        source: 'explorer',
                        status: tx.isError === '1' || tx.txreceipt_status === '0' ? 'Failed' : 'Confirmed'
                    };
                });
        } catch (err) {
            console.warn('No se pudo cargar historial del explorer:', err);
            explorerHistory = [];
        }
    }

    async function loadTokenTransferHistory() {
        if (!provider || !address) return;

        try {
            const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
            const [decimals, symbol, latestBlock] = await Promise.all([
                contract.decimals(),
                contract.symbol(),
                provider.getBlockNumber()
            ]);
            const fromBlock = Math.max(0, latestBlock - 120000);
            const sentFilter = contract.filters.Transfer(address, null);
            const receivedFilter = contract.filters.Transfer(null, address);
            const [sentLogs, receivedLogs] = await Promise.all([
                contract.queryFilter(sentFilter, fromBlock, latestBlock),
                contract.queryFilter(receivedFilter, fromBlock, latestBlock)
            ]);

            const logs = [...sentLogs, ...receivedLogs];
            const blocks = new Map();

            tokenHistory = await Promise.all(logs.map(async (event) => {
                const parsed = /** @type {any} */(event).args;
                const from = parsed?.from || parsed?.[0];
                const to = parsed?.to || parsed?.[1];
                const value = parsed?.value || parsed?.[2];
                const isReceived = String(to).toLowerCase() === address.toLowerCase();
                const blockNumber = event.blockNumber;

                if (!blocks.has(blockNumber)) {
                    blocks.set(blockNumber, provider?.getBlock(blockNumber));
                }

                const block = await blocks.get(blockNumber);

                return {
                    hash: event.transactionHash,
                    from,
                    to,
                    amount: ethers.formatUnits(value, decimals),
                    type: isReceived ? 'Received' : 'Sent',
                    timestamp: block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
                    chainId,
                    networkName: getNetworkName(chainId),
                    explorerBase: getExplorerBase(chainId),
                    assetSymbol: symbol,
                    isToken: true,
                    source: 'token-event',
                    logIndex: event.index
                };
            }));
        } catch (err) {
            console.warn('No se pudo cargar historial de TSYS:', err);
        }
    }

    /** @param {any} tx */
    function recordTransaction(tx) {
        if (!address) return;
        const newEntry = {
            ...tx,
            timestamp: new Date().toISOString(),
            chainId: chainId,
            networkName: getNetworkName(chainId),
            explorerBase: getExplorerBase(chainId),
            assetSymbol: getNetworkTicker(chainId),
            isToken: false,
            source: 'local'
        };
        localHistory = [newEntry, ...localHistory];
        localStorage.setItem(`pali_history_${address.toLowerCase()}`, JSON.stringify(localHistory));
    }

    async function tryAutoReconnect() {
        const wasConnected = sessionStorage.getItem('pali_connected');
        if (!wasConnected) return;

        const ethereum = /** @type {any} */(window).ethereum;
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
                // Siempre empezar en intro como pidió el usuario
                activeTab = 'intro';
            } else {
                sessionStorage.removeItem('pali_connected');
            }
        } catch (err) {
            console.warn('Auto-reconnect failed:', err);
            sessionStorage.removeItem('pali_connected');
        }
    }

    /** @param {any} ethereum */
    function setupListeners(ethereum) {
        if (ethereum.on) {
            ethereum.on('chainChanged', handleChainChanged);
            ethereum.on('accountsChanged', handleAccountsChanged);
        }
    }

    function removeListeners() {
        const ethereum = /** @type {any} */(window).ethereum;
        if (ethereum?.removeListener) {
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    }

    /** @param {string} id */
    async function changeTab(id) {
        if (!connected && id !== 'intro') return;
        activeTab = id;
        await tick();
    }

    async function connectWallet() {
        error = ''; loading = true;
        try {
            const ethereum = /** @type {any} */(window).ethereum;
            if (!ethereum) { 
                error = 'Pali Wallet no detectada.'; 
                return; 
            }
            
            await ethereum.request({ 
                method: 'wallet_requestPermissions', 
                params: [{ eth_accounts: {} }] 
            });

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) throw new Error('No se seleccionó cuenta.');

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
            error = (/** @type {any} */(err)).message || 'Error conexión';
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

    /** @param {string} _chainHex */
    async function handleChainChanged(_chainHex) {
        try {
            const ethereum = /** @type {any} */(window).ethereum;
            if (!ethereum) return;
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            const network = await provider.getNetwork();
            chainId = network.chainId.toString();
            await refreshBalance();
            await loadTokenBalance();
            showNetworkDropdown = false;
        } catch (err) {
            console.error('Error chain change:', err);
        }
    }

    /** @param {any} net */
    async function switchNetwork(net) {
        const ethereum = /** @type {any} */(window).ethereum;
        if (!ethereum) return;
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: net.chainHex }]
            });
            showNetworkDropdown = false;
        } catch (err) {
            console.error('Switch network error:', err);
        }
    }

    /** @param {string[]} accounts */
    async function handleAccountsChanged(accounts) {
        if (!accounts || accounts.length === 0) {
            disconnect();
            return;
        }
        try {
            const ethereum = /** @type {any} */(window).ethereum;
            if (!ethereum) return;
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            await refreshBalance();
            await loadTokenBalance();
        } catch (err) {
            console.error('Error account change:', err);
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
        localHistory = [];
        tokenHistory = [];
        explorerHistory = [];
        tokenHistoryKey = '';
        explorerHistoryKey = '';
        tokenBalance = '';
        sessionStorage.removeItem('pali_connected');
        changeTab('intro');
    }

    /** Click outside handler para cerrar dropdown */
    function handleGlobalClick() {
        if (showNetworkDropdown) showNetworkDropdown = false;
    }

    /** @param {string} addr */
    function shortAddress(addr) {
        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }


</script>

{#if showInitialLoader}
    <div class="initial-loader" out:fade={{ duration: 400 }}>
        <!-- Anillos de energía -->
        <div class="energy-ring ring-1"></div>
        <div class="energy-ring ring-2"></div>
        <div class="energy-ring ring-3"></div>
        
        <!-- Partículas flotantes -->
        <div class="particles">
            <span class="particle p1"></span>
            <span class="particle p2"></span>
            <span class="particle p3"></span>
            <span class="particle p4"></span>
            <span class="particle p5"></span>
            <span class="particle p6"></span>
            <span class="particle p7"></span>
            <span class="particle p8"></span>
        </div>

        <!-- Trébol evolutivo -->
        <div class="clover-stage">
            <svg viewBox="0 0 200 200" class="clover-svg">
                <!-- Hoja 1 - Arriba -->
                <path class="leaf leaf-1" d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" />
                <!-- Hoja 2 - Derecha -->
                <path class="leaf leaf-2" d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" />
                <!-- Hoja 3 - Izquierda -->
                <path class="leaf leaf-3" d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" />
                <!-- Hoja 4 - Abajo -->
                <path class="leaf leaf-4" d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" />
                <!-- Hoja 5 - Demonio (diagonal) -->
                <path class="leaf leaf-5" d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" />
                <!-- Tallo -->
                <line class="stem" x1="100" y1="100" x2="100" y2="175" />
                <!-- Centro -->
                <circle cx="100" cy="100" r="5" class="clover-core" />
            </svg>
        </div>
    </div>
{/if}


<svelte:window on:click={handleGlobalClick} />

<div class="app-container asta-aura">

    <nav class="navbar">
        <div class="nav-left">
            <div class="brand">
                <svg width="30" height="30" viewBox="0 0 200 200" fill="none" class="nav-clover">
                    <path d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" fill="var(--accent)" />
                    <path d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" fill="var(--accent)" />
                    <path d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" fill="var(--accent)" />
                    <path d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" fill="var(--accent)" />
                    <path d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" fill="var(--accent)" opacity="0.7"/>
                    <circle cx="100" cy="100" r="6" fill="var(--accent)" />
                </svg>
                <h2 class="cinzel">CORE<span>TERMINAL</span></h2>
            </div>
            
            <div class="nav-links">
                {#each tabs as tab}
                    <button 
                        class="nav-link {activeTab === tab.id ? 'active' : ''}"
                        on:click={() => changeTab(tab.id)}
                        disabled={!connected && tab.id !== 'intro'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d={tab.icon}/>
                        </svg>
                        {tab.label}
                    </button>
                {/each}
            </div>
        </div>

        <div class="nav-right">
            {#if connected}
                <div class="net-switcher" on:click|stopPropagation>
                    <button class="net-btn" on:click={() => showNetworkDropdown = !showNetworkDropdown}>
                        <span class="dot"></span>
                        {getNetworkName(chainId)}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {#if showNetworkDropdown}
                        <div class="net-dropdown" transition:fade={{ duration: 150 }}>
                            <p class="dropdown-title">Seleccionar Protocolo</p>
                            {#each EVM_NETWORKS as net}
                                <button 
                                    class="net-item {chainId === net.id ? 'active' : ''}"
                                    on:click={() => switchNetwork(net)}
                                >
                                    <span class="net-dot {chainId === net.id ? 'on' : ''}"></span>
                                    {net.name}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <button class="logout-btn" on:click={disconnect} title="Cerrar Sesión">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Cerrar Sesión
                </button>
            {:else}
                <button class="connect-btn" on:click={connectWallet} disabled={loading}>
                    {loading ? 'Conectando...' : 'Conectar Wallet'}
                </button>
            {/if}
        </div>
    </nav>

    <main class="main-content">
        <div class="view-container">
            {#if activeTab === 'intro'}
                <Intro />
            {:else if activeTab === 'wallet'}
                <Wallet 
                    {balance} {address} {chainId} {history} {tokenBalance} {tokenSymbol} {signer} {connected}
                    onTransactionConfirmed={refreshBalance} 
                    onNewTransaction={recordTransaction}
                />
            {/if}
        </div>
    </main>
</div>


<style>
    .app-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: var(--bg);
    }

    .navbar {
        height: 70px;
        padding: 0 5%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(10, 10, 10, 0.95);
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 100;
        backdrop-filter: blur(10px);
    }

    .nav-left, .nav-right {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .nav-clover {
        filter: drop-shadow(0 0 4px rgba(230, 0, 0, 0.5));
    }

    .brand h2 {
        font-size: 1.1rem;
        margin: 0;
        color: #e0e0e0;
    }

    .brand h2 span {
        color: var(--accent);
        margin-left: 4px;
    }

    .nav-links {
        display: flex;
        gap: 0.5rem;
    }

    .nav-link {
        background: none;
        border: none;
        color: #bbb;
        font-weight: 600;
        cursor: pointer;
        padding: 0.5rem 1rem;
        transition: color 0.2s, background 0.2s;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
    }

    .nav-link:hover:not(:disabled) {
        color: var(--accent);
        background: rgba(230, 0, 0, 0.08);
    }

    .nav-link.active {
        color: var(--accent);
        background: rgba(230, 0, 0, 0.12);
    }

    .nav-link:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .net-switcher {
        position: relative;
    }

    .net-btn {
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-color);
        color: #ddd;
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
        transition: border-color 0.2s;
    }

    .net-btn:hover {
        border-color: var(--accent);
    }

    .dot {
        width: 7px;
        height: 7px;
        background: var(--success);
        border-radius: 50%;
        box-shadow: 0 0 6px var(--success);
    }

    .net-dropdown {
        position: absolute;
        top: 120%;
        right: 0;
        background: #111;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 0.5rem;
        min-width: 200px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.7);
    }

    .dropdown-title {
        font-size: 0.65rem;
        color: #888;
        text-transform: uppercase;
        margin: 0.5rem 0.75rem;
        font-weight: 800;
        letter-spacing: 0.1em;
    }

    .net-item {
        width: 100%;
        padding: 0.55rem 0.75rem;
        background: none;
        border: none;
        color: #ccc;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        transition: background 0.15s;
    }

    .net-item:hover {
        background: rgba(230, 0, 0, 0.08);
        color: #fff;
    }

    .net-item.active {
        color: var(--accent);
        font-weight: 700;
    }

    .net-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #333;
        flex-shrink: 0;
    }

    .net-dot.on {
        background: var(--success);
        box-shadow: 0 0 6px var(--success);
    }

    .logout-btn {
        background: none;
        border: 1px solid rgba(230, 0, 0, 0.3);
        color: #ccc;
        padding: 0.45rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .logout-btn:hover {
        background: rgba(230, 0, 0, 0.15);
        border-color: var(--accent);
        color: var(--accent);
    }

    .connect-btn {
        background: var(--accent);
        color: #000;
        border: none;
        padding: 0.55rem 1.5rem;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 0.85rem;
    }

    .connect-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(230, 0, 0, 0.4);
    }


    .main-content {
        flex: 1;
        padding: 3rem 5%;
        overflow-y: auto;
    }

    .view-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    /* ═══════════════════════════════════════════════════
       CINEMATIC CLOVER LOADER
       ═══════════════════════════════════════════════════ */

    .initial-loader {
        position: fixed;
        inset: 0;
        background: #000;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    /* ── Energy Rings ── */
    .energy-ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid rgba(230, 0, 0, 0.15);
        opacity: 0;
    }

    .ring-1 {
        width: 300px; height: 300px;
        animation: ring-expand 2s ease-out 0.5s forwards;
    }
    .ring-2 {
        width: 450px; height: 450px;
        animation: ring-expand 2s ease-out 1.2s forwards;
    }
    .ring-3 {
        width: 600px; height: 600px;
        animation: ring-expand 2s ease-out 1.8s forwards;
    }

    @keyframes ring-expand {
        0% { opacity: 0; transform: scale(0.3); }
        40% { opacity: 0.6; }
        100% { opacity: 0; transform: scale(1.2); }
    }

    /* ── Floating Particles ── */
    .particles {
        position: absolute;
        width: 300px; height: 300px;
    }

    .particle {
        position: absolute;
        width: 3px; height: 3px;
        background: var(--accent);
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 6px var(--accent);
    }

    .p1 { top: 0; left: 50%; animation: particle-float 2.5s ease-in-out 1.0s infinite; }
    .p2 { top: 15%; right: 10%; animation: particle-float 2.8s ease-in-out 1.2s infinite; }
    .p3 { bottom: 15%; right: 5%; animation: particle-float 2.2s ease-in-out 1.4s infinite; }
    .p4 { bottom: 0; left: 50%; animation: particle-float 2.6s ease-in-out 1.1s infinite; }
    .p5 { bottom: 15%; left: 5%; animation: particle-float 2.4s ease-in-out 1.5s infinite; }
    .p6 { top: 15%; left: 10%; animation: particle-float 2.7s ease-in-out 1.3s infinite; }
    .p7 { top: 30%; right: 0; animation: particle-float 2.3s ease-in-out 1.6s infinite; }
    .p8 { top: 30%; left: 0; animation: particle-float 2.9s ease-in-out 1.0s infinite; }

    @keyframes particle-float {
        0%, 100% { opacity: 0; transform: translateY(0) scale(1); }
        20% { opacity: 1; }
        50% { opacity: 0.8; transform: translateY(-30px) scale(1.5); }
        80% { opacity: 0.3; }
    }

    /* ── Clover Stage ── */
    .clover-stage {
        position: relative;
        z-index: 2;
    }

    .clover-svg {
        width: 200px;
        height: 200px;
        filter: drop-shadow(0 0 0px transparent);
        animation: clover-final-glow 1s ease-in 2.2s forwards;
    }

    @keyframes clover-final-glow {
        to {
            filter: drop-shadow(0 0 20px rgba(230, 0, 0, 0.6))
                    drop-shadow(0 0 60px rgba(230, 0, 0, 0.3));
        }
    }

    /* ── Leaf Styles ── */
    .leaf {
        fill: #222;
        stroke: #333;
        stroke-width: 0.5;
        opacity: 0;
        transform-origin: 100px 100px;
    }

    /* 3 primeras hojas: aparecen una a una */
    .leaf-1 {
        animation: leaf-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
    }
    .leaf-2 {
        animation: leaf-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards;
    }
    .leaf-3 {
        animation: leaf-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s forwards;
    }

    /* 4ta hoja: pausa dramática, luego crece */
    .leaf-4 {
        animation: leaf-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards;
    }

    /* 5ta hoja: la del demonio. Aparece oscura con brillo rojo */
    .leaf-5 {
        animation: leaf-5th-awaken 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 2.2s forwards;
    }

    @keyframes leaf-grow {
        0% { opacity: 0; transform: scale(0) rotate(-20deg); }
        60% { opacity: 1; transform: scale(1.1) rotate(5deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); fill: #333; stroke: #555; }
    }

    @keyframes leaf-5th-awaken {
        0% { opacity: 0; transform: scale(0) rotate(-30deg); fill: #000; }
        50% { opacity: 1; transform: scale(1.2) rotate(10deg); fill: #110000; stroke: var(--accent); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); fill: #0a0000; stroke: var(--accent); stroke-width: 1; }
    }

    /* ── Stem ── */
    .stem {
        stroke: #333;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-dasharray: 75;
        stroke-dashoffset: 75;
        animation: stem-draw 0.5s ease-out 0.1s forwards;
    }

    @keyframes stem-draw {
        to { stroke-dashoffset: 0; }
    }

    /* ── Center Core ── */
    .clover-core {
        fill: #111;
        opacity: 0;
        animation: core-appear 0.3s ease 0.2s forwards, core-pulse 1.5s ease-in-out 2.2s infinite;
    }

    @keyframes core-appear {
        to { opacity: 1; }
    }

    @keyframes core-pulse {
        0%, 100% { fill: #111; r: 5; }
        50% { fill: var(--accent); r: 7; filter: drop-shadow(0 0 10px var(--accent)); }
    }

    /* ── Final Transition: scale up + fade out ── */
    .initial-loader {
        animation: loader-exit 0.6s ease-in 3.2s forwards;
    }

    @keyframes loader-exit {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0; transform: scale(1.15); }
    }

    @media (max-width: 768px) {
        .nav-links { display: none; }
        .navbar { padding: 0 1rem; }
        .nav-right { gap: 0.5rem; }
        .clover-svg { width: 150px; height: 150px; }
    }
</style>

