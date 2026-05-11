<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { EVM_NETWORKS, UTXO_NETWORKS, buildAddChainParams, getNetworkName } from './config/networks.js';

    export let chainId = '';

    const dispatch = createEventDispatcher();

    let error = '';
    let status = '';
    let selectedNetworkId = '57057';
    let detectedChainId = '';
    let busyNetworkId = '';
    let busyUtxoId = '';
    let activeUtxoNetworkId = '';
    /** @type {any} */
    let utxoAccount = null;

    const utxoNetworks = UTXO_NETWORKS;
    const evmNetworks = EVM_NETWORKS;

    $: selectedNetwork = evmNetworks.find((network) => network.id === selectedNetworkId) || evmNetworks[0];
    $: activeChainId = chainId || detectedChainId;
    $: activeNetwork = evmNetworks.find((network) => network.id === activeChainId);

    onMount(() => {
        detectActiveNetwork();
        detectUtxoState();
    });

    function getPaliProvider() {
        return /** @type {any} */(window).pali;
    }

    /** 
     * @param {string} method 
     * @param {string} [directName]
     */
    async function callPali(method, directName = '') {
        const pali = getPaliProvider();
        if (!pali) throw new Error('Pali Wallet no detectada.');

        if (typeof pali.request === 'function') {
            return pali.request({ method });
        }

        if (directName && typeof pali[directName] === 'function') {
            return pali[directName]();
        }

        throw new Error(`Metodo no disponible: ${method}`);
    }

    /** 
     * @param {any} target 
     * @param {any} network 
     * @param {any} [sysState]
     */
    function matchesUtxoNetwork(target, network, sysState = {}) {
        const label = `${network?.label || ''} ${network?.key || ''} ${network?.currency || ''} ${network?.url || ''} ${sysState?.blockExplorerURL || ''}`.toLowerCase();
        if (target.id === 'bitcoin') return target.expectedLabels.some((word) => label.includes(word)) || sysState?.isBitcoinBased === true;
        if (typeof sysState?.isTestnet === 'boolean') return sysState.isTestnet === target.isTestnet;
        return target.expectedLabels.some((word) => label.includes(word));
    }

    async function detectUtxoState() {
        const pali = getPaliProvider();
        if (!pali) return;

        try {
            const [state, network, account, balance] = await Promise.allSettled([
                callPali('wallet_getSysProviderState'),
                callPali('wallet_getNetwork', 'getNetwork'),
                callPali('wallet_getAccount', 'getAccount'),
                callPali('wallet_getBalance', 'getBalance')
            ]);

            const sysState = state.status === 'fulfilled' ? state.value : {};
            const currentNetwork = network.status === 'fulfilled' ? network.value : {};
            const currentAccount = account.status === 'fulfilled' ? account.value : null;
            const currentBalance = balance.status === 'fulfilled' ? balance.value : null;

            const matched = utxoNetworks.find((net) => matchesUtxoNetwork(net, currentNetwork, sysState));
            activeUtxoNetworkId = matched?.id || '';
            utxoAccount = currentAccount ? { ...currentAccount, balance: currentBalance, network: currentNetwork } : null;
        } catch (err) {
            console.warn('Error detectando estado UTXO:', err);
        }
    }

    /** @param {any} net */
    async function connectUtxoNetwork(net) {
        error = ''; status = ''; busyUtxoId = net.id;
        try {
            const pali = getPaliProvider();
            if (!pali) throw new Error('Pali Wallet no detectada.');
            status = `Conectando ${net.name}...`;
            if (typeof pali.request === 'function') {
                await pali.request({ method: 'sys_requestAccounts', params: [] });
            } else if (typeof pali.enable === 'function') {
                await pali.enable();
            }
            await detectUtxoState();
            status = `${net.name} conectada.`;
        } catch (err) {
            error = (/** @type {any} */(err)).message || 'Error de conexión UTXO';
        } finally {
            busyUtxoId = '';
        }
    }

    async function detectActiveNetwork() {
        try {
            const ethereum = /** @type {any} */(window).ethereum;
            if (!ethereum) return;
            const chainHex = await ethereum.request({ method: 'eth_chainId' });
            detectedChainId = parseInt(chainHex, 16).toString();
        } catch (err) {
            console.warn('Error detectando red EVM:', err);
        }
    }

    /** @param {any} net */
    async function switchNetwork(net) {
        error = ''; status = ''; busyNetworkId = net.id;
        try {
            const ethereum = /** @type {any} */(window).ethereum;
            if (!ethereum) throw new Error('Pali Wallet (EVM) no detectada.');

            status = `Cambiando a ${net.name}...`;
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: net.chainHex }],
            });

            status = `Red cambiada a ${net.name}`;
            dispatch('networkChanged', net.id);
        } catch (switchError) {
            if (/** @type {any} */(switchError).code === 4902) {
                try {
                    await (/** @type {any} */(window).ethereum).request({
                        method: 'wallet_addEthereumChain',
                        params: [buildAddChainParams(net)],
                    });
                    dispatch('networkChanged', net.id);
                } catch (addError) {
                    error = (/** @type {any} */(addError)).message || 'Error al agregar la red';
                }
            } else {
                error = (/** @type {any} */(switchError)).message || 'Error al cambiar de red';
            }
        } finally {
            busyNetworkId = '';
        }
    }
</script>
</script>

<div class="networks-pane">
    <div class="manager-header">
        <h3 class="cinzel">CONTROL DE CAPAS</h3>
        <p>Sincroniza tu Terminal con los diferentes Protocolos de Red.</p>
    </div>

    <div class="active-status">
        <div class="status-item">
            <span class="cinzel label">Protocolo EVM</span>
            <strong class="value gold-text">{activeNetwork?.name || 'Inactivo'}</strong>
        </div>
        <div class="status-item">
            <span class="cinzel label">Protocolo UTXO</span>
            <strong class="value silver-text">{utxoNetworks.find(n => n.id === activeUtxoNetworkId)?.name || 'Inactivo'}</strong>
        </div>
    </div>

    <div class="section-divider cinzel">Capas EVM</div>
    <div class="network-list">
        {#each evmNetworks as net}
            <button class="net-row {activeChainId === net.id ? 'active gold' : ''}" on:click={() => switchNetwork(net)} disabled={busyNetworkId !== ''}>
                <div class="net-icon cinzel">{net.iconText}</div>
                <div class="net-info">
                    <span class="net-name">{net.name}</span>
                    <span class="net-sub">Chain ID: {net.id}</span>
                </div>
                {#if activeChainId === net.id}
                    <span class="status-tag gold">ACTIVA</span>
                {:else}
                    <span class="status-tag">USAR</span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="section-divider cinzel">Redes UTXO</div>
    <div class="network-list">
        {#each utxoNetworks as net}
            <button class="net-row {activeUtxoNetworkId === net.id ? 'active silver' : ''}" on:click={() => connectUtxoNetwork(net)} disabled={busyUtxoId !== ''}>
                <div class="net-icon cinzel silver">{net.iconText}</div>
                <div class="net-info">
                    <span class="net-name">{net.name}</span>
                    <span class="net-sub">{net.symbol}</span>
                </div>
                {#if activeUtxoNetworkId === net.id}
                    <span class="status-tag silver">CONECTADA</span>
                {:else}
                    <span class="status-tag">CONECTAR</span>
                {/if}
            </button>
        {/each}
    </div>

    {#if status || error}
        <footer class="msg-footer">
            {#if status}<p class="status-msg">{status}</p>{/if}
            {#if error}<p class="error-msg">{error}</p>{/if}
        </footer>
    {/if}
</div>

<style>
    .networks-pane {
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .manager-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--accent);
    }

    .manager-header p {
        margin: 0.2rem 0 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .active-status {
        background: var(--bg);
        border: 1px solid var(--border-color);
        padding: 0.75rem;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-item .label {
        font-size: 0.65rem;
        color: var(--text-secondary);
        text-transform: uppercase;
    }

    .status-item .value {
        font-size: 0.85rem;
        font-weight: 700;
    }

    .gold-text { color: var(--accent); }
    .silver-text { color: var(--accent-2); }

    .section-divider {
        font-size: 0.7rem;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.25rem;
        margin-top: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .network-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .net-row {
        background: var(--surface-soft);
        border: 1px solid var(--border-color);
        padding: 0.6rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }

    .net-row:hover:not(:disabled) {
        background: var(--surface);
        border-color: var(--accent-2);
    }

    .net-row.active.gold { border-color: var(--accent); background: rgba(212, 175, 55, 0.05); }
    .net-row.active.silver { border-color: var(--accent-2); background: rgba(192, 192, 192, 0.05); }

    .net-icon {
        width: 32px;
        height: 32px;
        background: var(--bg);
        border: 1px solid var(--accent);
        color: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 900;
        border-radius: 2px;
    }

    .net-icon.silver {
        border-color: var(--accent-2);
        color: var(--accent-2);
    }

    .net-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .net-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-primary);
    }

    .net-sub {
        font-size: 0.65rem;
        color: var(--text-secondary);
    }

    .status-tag {
        font-size: 0.6rem;
        font-weight: 800;
        padding: 0.2rem 0.4rem;
        border-radius: 2px;
        background: var(--bg);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .status-tag.gold { color: var(--accent); border-color: var(--accent); }
    .status-tag.silver { color: var(--accent-2); border-color: var(--accent-2); }

    .msg-footer {
        padding-top: 0.5rem;
        border-top: 1px solid var(--border-color);
    }

    .status-msg { font-size: 0.7rem; color: var(--accent-2); margin: 0; }
    .error-msg { font-size: 0.7rem; color: var(--error); margin: 0; }

    button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
