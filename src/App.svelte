<script>
    import { ethers } from 'ethers';
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    const TOKEN_ADDRESS = "0x48e29Ec3a874FF754BE17D96dBE084dF54202B03";
    let tokenBalance = '';
    let tokenSymbol = 'TSYS';
    let tokenDecimals = 18;

    import { onMount, tick } from 'svelte';
    import { fade } from 'svelte/transition';
    import Intro from './lib/Intro.svelte';
    import Wallet from './lib/Wallet.svelte';
    import Networks from './lib/Networks.svelte';
    import { getExplorerApiUrl, getExplorerBase, getNetworkName, getNetworkTicker, EVM_NETWORKS, UTXO_NETWORKS } from './lib/config/networks.js';
    import { fetchWithRetry } from './composables/retry.js';

    let address = '';
    let balance = '';
    let chainId = '';
    let error = '';
    let connected = false;
    let loading = false;
    let historyLoading = false;
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
    let activeTab = 'intro';
    let showNetworkDropdown = false;
    let showInitialLoader = true;
    /** @type {string[]} */
    let hiddenNetworks = JSON.parse(localStorage.getItem('pali_hidden_networks') || '[]');

    function toggleHideNetwork(id) {
        if (hiddenNetworks.includes(id)) {
            hiddenNetworks = hiddenNetworks.filter(n => n !== id);
        } else {
            hiddenNetworks = [...hiddenNetworks, id];
        }
        localStorage.setItem('pali_hidden_networks', JSON.stringify(hiddenNetworks));
    }

    const tabs = [
        { id: 'intro', label: 'Inicio', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'wallet', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: 'networks', label: 'Redes', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' }
    ];

    onMount(() => {
        tryAutoReconnect();
        initAnimations();
        setTimeout(() => { showInitialLoader = false; }, 3000);

        const ethereum = /** @type {any} */ (window).ethereum;
        if (ethereum) {
            ethereum.on('accountsChanged', (/** @type {string[]} */ accounts) => {
                if (accounts.length > 0) {
                    address = accounts[0];
                    connected = true;
                    refreshBalance();
                } else {
                    disconnect();
                }
            });

            ethereum.on('chainChanged', (/** @type {string} */ hex) => {
                chainId = parseInt(hex, 16).toString();
                // Re-setup to ensure provider is in sync with new chain
                const ethereum = /** @type {any} */ (window).ethereum;
                provider = new ethers.BrowserProvider(ethereum);
                refreshBalance();
                loadExplorerHistory();
            });
        }
    });

    function initAnimations() {
        const win = /** @type {any} */ (window);
        if (typeof win.anime !== 'undefined') {
            win.anime({
                targets: '.clover-leaf',
                scale: [0, 1],
                opacity: [0, 1],
                delay: win.anime.stagger(200),
                easing: 'easeOutElastic(1, .8)'
            });
        }
    }

    $: if (address && chainId) {
        refreshBalance();
        loadExplorerHistory();
        loadTokenTransferHistory();
    }
    $: if (address && provider) loadTokenBalance();
    $: history = mergeHistory(explorerHistory, tokenHistory);

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
        } catch (err) { tokenBalance = '0'; }
    }

    /** @param {string} addr */
    function loadHistory(addr) {
        try {
            const saved = localStorage.getItem(`pali_history_${addr.toLowerCase()}`);
            localHistory = saved ? JSON.parse(saved) : [];
        } catch (err) { localHistory = []; }
    }

    /** @param {any[]} groups */
    function mergeHistory(...groups) {
        const seen = new Set();
        return groups.flat()
            .filter((tx) => {
                if (!tx || !tx.hash) return false;
                const key = `${tx.hash}_${tx.type}_${tx.assetSymbol || ''}_${tx.logIndex ?? ''}_${tx.amount}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }

    async function loadExplorerHistory() {
        if (!address || !chainId) return;
        const apiUrl = getExplorerApiUrl(chainId);
        if (!apiUrl) { explorerHistory = []; return; }
        historyLoading = true;
        try {
            const response = await fetchWithRetry(`${apiUrl}?module=account&action=txlist&address=${address}&sort=desc`);
            const payload = await response.json();
            const rows = payload?.result || [];
            const ticker = getNetworkTicker(chainId);
            explorerHistory = rows.filter((/** @type {any} */ tx) => tx.hash && tx.value !== '0').map((/** @type {any} */ tx) => ({
                hash: tx.hash, from: tx.from, to: tx.to, amount: ethers.formatEther(tx.value),
                type: tx.to.toLowerCase() === address.toLowerCase() ? 'Received' : 'Sent',
                timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                chainId, networkName: getNetworkName(chainId), explorerBase: getExplorerBase(chainId),
                assetSymbol: ticker, status: tx.isError === '1' ? 'Failed' : 'Confirmed'
            }));
        } catch (err) { explorerHistory = []; }
        finally { historyLoading = false; }
    }

    async function loadTokenTransferHistory() {
        if (!provider || !address) return;
        try {
            const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
            const [decimals, symbol, latestBlock] = await Promise.all([
                contract.decimals(), contract.symbol(), provider.getBlockNumber()
            ]);
            const logs = await contract.queryFilter(contract.filters.Transfer(address, null), latestBlock - 100000);
            tokenHistory = await Promise.all(logs.map(async (event) => {
                const block = await provider.getBlock(event.blockNumber);
                const ev = /** @type {any} */ (event);
                return {
                    hash: ev.transactionHash, from: ev.args[0], to: ev.args[1],
                    amount: ethers.formatUnits(ev.args[2], decimals),
                    type: String(ev.args[1]).toLowerCase() === address.toLowerCase() ? 'Received' : 'Sent',
                    timestamp: new Date((block?.timestamp || 0) * 1000).toISOString(),
                    chainId, networkName: getNetworkName(chainId), assetSymbol: symbol
                };
            }));
        } catch (err) { console.warn(err); }
    }

    /** @param {any} tx */
    function recordTransaction(tx) {
        if (!address) return;
        localHistory = [{...tx, timestamp: new Date().toISOString(), source: 'local'}, ...localHistory];
        localStorage.setItem(`pali_history_${address.toLowerCase()}`, JSON.stringify(localHistory));
    }

    async function tryAutoReconnect() {
        if (!sessionStorage.getItem('pali_connected')) return;
        const ethereum = /** @type {any} */ (window).ethereum;
        if (!ethereum) return;
        try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                provider = new ethers.BrowserProvider(ethereum);
                signer = await provider.getSigner();
                address = await signer.getAddress();
                const rawBalance = await provider.getBalance(address);
                balance = ethers.formatEther(rawBalance);
                chainId = (await provider.getNetwork()).chainId.toString();
                connected = true;
                activeTab = 'wallet';
            }
        } catch (err) { sessionStorage.removeItem('pali_connected'); }
    }

    async function refreshBalance() {
        if (!address || !provider) return;
        try {
            const rawBalance = await provider.getBalance(address);
            balance = ethers.formatEther(rawBalance);
            await loadTokenBalance();
            await loadExplorerHistory();
            await loadTokenTransferHistory();
        } catch (err) { console.error("Error refreshing:", err); }
    }

    async function connectWallet() {
        loading = true;
        try {
            const ethereum = /** @type {any} */ (window).ethereum;
            if (!ethereum) { error = 'Pali Wallet not detected'; return; }
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            address = await signer.getAddress();
            balance = ethers.formatEther(await provider.getBalance(address));
            chainId = (await provider.getNetwork()).chainId.toString();
            connected = true;
            sessionStorage.setItem('pali_connected', 'true');
            activeTab = 'wallet';
        } catch (err) { error = (/** @type {any} */ (err)).message; }
        finally { loading = false; }
    }

    function disconnect() {
        address = ''; connected = false; activeTab = 'intro';
        sessionStorage.removeItem('pali_connected');
    }

    /** @param {any} net */
    /** @param {any} net */
    async function switchNetwork(net) {
        try {
            const ethereum = /** @type {any} */ (window).ethereum;
            if (!ethereum) return;
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: net.chainHex }]
            });
            showNetworkDropdown = false;
        } catch (err) { 
            const error = /** @type {any} */ (err);
            if (error.code === 4902) {
                try {
                    const ethereum = /** @type {any} */ (window).ethereum;
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: net.chainHex,
                                chainName: net.name,
                                rpcUrls: [net.rpc],
                                nativeCurrency: {
                                    name: net.nativeCurrencyName || net.ticker,
                                    symbol: net.ticker,
                                    decimals: 18
                                },
                                blockExplorerUrls: net.explorer ? [net.explorer] : undefined
                            }
                        ]
                    });
                } catch (addError) {
                    console.error("Error adding network:", addError);
                }
            }
            console.error("Error switching network:", error); 
        }
    }

    /** @param {any} net */
    async function switchUtxoNetwork(net) {
        try {
            const pali = /** @type {any} */ (window).pali;
            if (!pali) { error = 'Pali Wallet (UTXO) not detected'; return; }
            await pali.request({
                method: 'sys_changeUTXOEVM',
                params: [{ chainId: net.id === 'bitcoin' ? 'bitcoin' : 57 }]
            });
        } catch (err) { console.error("Error switching UTXO:", err); }
    }

    function handleGlobalClick() { showNetworkDropdown = false; }
</script>

<svelte:window on:click={handleGlobalClick} />

{#if showInitialLoader}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden" out:fade>
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--color-anti-accent)_0%,transparent_70%)] animate-pulse"></div>
        <div class="relative flex flex-col items-center">
            <div class="w-40 h-40 relative">
                <svg viewBox="0 0 200 200" class="w-full h-full drop-shadow-[0_0_20px_rgba(230,0,0,0.8)]">
                    <path class="clover-leaf fill-anti-accent" d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" />
                    <path class="clover-leaf fill-anti-accent" d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" />
                    <path class="clover-leaf fill-anti-accent" d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" />
                    <path class="clover-leaf fill-anti-accent" d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" />
                    <path class="clover-leaf fill-black stroke-anti-accent stroke-2" d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" />
                </svg>
            </div>
            <h1 class="mt-8 font-cinzel text-4xl font-black tracking-[0.2em] text-white uppercase">Fernando <span class="text-anti-accent">Dev</span></h1>
            <div class="mt-4 h-1 w-48 bg-anti-border relative overflow-hidden">
                <div class="absolute inset-0 bg-anti-accent animate-[shimmer_2s_infinite]"></div>
            </div>
            <p class="mt-4 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Sincronizando con la red...</p>
        </div>
    </div>
{/if}

<div class="min-h-screen bg-anti-bg text-gray-100 flex flex-col selection:bg-anti-accent selection:text-white font-sans">
    <nav class="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-anti-border px-8 py-5 flex items-center justify-between">
        <div class="flex items-center gap-10">
            <div class="flex items-center gap-3 group cursor-pointer">
                <div class="w-10 h-10 bg-anti-accent/10 border border-anti-accent/30 rounded-lg flex items-center justify-center group-hover:bg-anti-accent/20 transition-all">
                    <svg width="24" height="24" viewBox="0 0 200 200" class="group-hover:scale-110 transition-transform">
                         <path d="M100 100 Q130 70 150 55" class="stroke-anti-accent stroke-10 fill-none" />
                         <circle cx="100" cy="100" r="15" class="fill-anti-accent" />
                    </svg>
                </div>
                <span class="font-cinzel text-2xl font-black tracking-tighter">FERNANDO<span class="text-anti-accent ml-1">DEV</span></span>
            </div>

            <div class="hidden lg:flex gap-2">
                {#each tabs as tab}
                    <button 
                        on:click={() => connected || tab.id === 'intro' ? activeTab = tab.id : null}
                        class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3
                        {activeTab === tab.id ? 'bg-anti-accent text-white shadow-[0_0_20px_rgba(230,0,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        {!connected && tab.id !== 'intro' ? 'opacity-20 cursor-not-allowed' : ''}"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon}/></svg>
                        {tab.label}
                    </button>
                {/each}
            </div>
        </div>

        <div class="flex items-center gap-6">
            {#if connected}
                <div class="relative">
                    <button 
                        on:click|stopPropagation={() => showNetworkDropdown = !showNetworkDropdown}
                        class="flex items-center gap-3 px-4 py-2 bg-anti-surface border border-anti-border rounded-xl text-xs font-black uppercase tracking-widest hover:border-anti-accent transition-all"
                    >
                        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        {getNetworkName(chainId)}
                    </button>
                    {#if showNetworkDropdown}
                        <div class="absolute right-0 mt-3 w-56 bg-anti-surface border border-anti-border rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95">
                            {#each EVM_NETWORKS.filter(n => !hiddenNetworks.includes(n.id)) as net}
                                <button 
                                    on:click={() => switchNetwork(net)}
                                    class="w-full text-left px-5 py-3 text-xs font-bold hover:bg-anti-accent/10 transition-colors flex items-center justify-between {chainId === net.id ? 'text-anti-accent' : 'text-gray-400'}"
                                >
                                    {net.name}
                                    {#if chainId === net.id}<div class="w-1.5 h-1.5 rounded-full bg-anti-accent"></div>{/if}
                                </button>
                            {/each}
                            {#if EVM_NETWORKS.filter(n => !hiddenNetworks.includes(n.id)).length === 0}
                                <div class="px-5 py-3 text-[10px] text-gray-600 uppercase font-black">Sin redes activas</div>
                            {/if}
                        </div>
                    {/if}
                </div>
                <button on:click={disconnect} class="text-gray-500 hover:text-anti-accent transition-colors p-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </button>
            {:else}
                <button 
                    on:click={connectWallet}
                    disabled={loading}
                    class="px-8 py-3 bg-anti-accent text-white font-black font-cinzel rounded-lg shadow-[0_0_25px_rgba(230,0,0,0.4)] hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'CONECTANDO...' : 'CONECTAR WALLET'}
                </button>
            {/if}
        </div>
    </nav>

    <main class="flex-1 w-full max-w-400 mx-auto p-8 lg:p-16">
        <div class="relative">
            {#if activeTab === 'intro'}
                <Intro onConnect={connectWallet} {loading} />
            {:else if activeTab === 'wallet'}
                {#if connected && address}
                    <Wallet 
                        {balance} {address} {chainId} {history} {tokenBalance} {signer}
                        {historyLoading}
                        onTransactionConfirmed={refreshBalance} 
                        onNewTransaction={recordTransaction}
                    />
                {:else}
                    <div class="flex flex-col items-center justify-center min-h-100 bg-anti-surface border border-anti-border rounded-4xl p-10 text-center" in:fade>
                        <div class="w-20 h-20 bg-anti-accent/10 rounded-full flex items-center justify-center mb-6">
                            <svg class="w-10 h-10 text-anti-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        </div>
                        <h2 class="font-cinzel text-2xl font-black text-white mb-4 uppercase">Sincronización Requerida</h2>
                        <p class="text-gray-500 max-w-md mb-8">Para visualizar tus activos y realizar transferencias, primero debes vincular tu Pali Wallet con este terminal.</p>
                        <button 
                            on:click={connectWallet}
                            disabled={loading}
                            class="px-10 py-4 bg-white text-black font-black font-cinzel text-lg rounded-2xl hover:bg-anti-accent hover:text-white transition-all duration-500"
                        >
                            {loading ? 'CONECTANDO...' : 'VINCULAR BILLETERA'}
                        </button>
                    </div>
                {/if}
            {:else if activeTab === 'networks'}
                <Networks 
                    currentChainId={chainId} 
                    {hiddenNetworks}
                    evmNetworks={EVM_NETWORKS}
                    utxoNetworks={UTXO_NETWORKS}
                    onSwitch={switchNetwork} 
                    onSwitchUtxo={switchUtxoNetwork}
                    onToggleHide={toggleHideNetwork}
                />
            {/if}
        </div>
    </main>

    <footer class="p-10 border-t border-anti-border flex flex-col items-center gap-4">
        <div class="flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">
            <span>Protocolo Descentralizado</span>
            <span>Seguridad de Red</span>
            <span>Fernando Dev v4.0</span>
        </div>
        <p class="text-[9px] text-gray-800 font-mono italic">"Innovación constante para la libertad financiera."</p>
    </footer>
</div>

<style>
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
</style>