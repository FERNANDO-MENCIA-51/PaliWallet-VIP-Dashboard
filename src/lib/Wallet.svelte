<script>
    import { fade } from 'svelte/transition';
    import { ethers } from 'ethers';
    import { getExplorerBase, getNetworkName, getNetworkTicker, SUPPORTED_EVM_CHAIN_IDS } from './config/networks.js';
    import { isValidChecksumAddress, isValidEthereumAddress, parseTransactionError } from '../composables/address.js';

    export let balance = '';
    export let address = '';
    export let chainId = '';
    export let tokenBalance = '';
    export let tokenSymbol = 'TSYS';
    /** @type {any[]} */
    export let history = [];
    /** @type {any} */
    export let signer = null;
    export let connected = false;

    /** @type {() => void} */
    export let onTransactionConfirmed = () => {};
    /** @type {(tx: any) => void} */
    export let onNewTransaction = (tx) => {};

    let copied = false;
    let toAddress = '';
    let amount = '';
    let loading = false;
    let txHash = '';
    let error = '';
    let txStatus = 'idle';
    let confirmations = 0;

    $: activeNetworkName = chainId ? getNetworkName(chainId) : 'No conectada';
    $: nativeTicker = getNetworkTicker(chainId);
    $: nativeBalance = parseFloat(balance || '0').toFixed(6);
    $: formattedTokenBalance = parseFloat(tokenBalance || '0').toFixed(4);

    /** @param {string} addr */
    function shortAddress(addr) {
        return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }

    async function copyAddress() {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }

    async function sendTx() {
        error = ''; txHash = ''; txStatus = 'idle'; confirmations = 0;
        if (!signer) { error = 'Billetera no conectada.'; return; }

        const addrValidation = isValidChecksumAddress(toAddress);
        if (!addrValidation.valid) { error = 'Dirección inválida.'; return; }
        if (addrValidation.suggestion && addrValidation.suggestion !== toAddress) toAddress = addrValidation.suggestion;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { error = 'Monto inválido.'; return; }

        try {
            loading = true;
            txStatus = 'pending';
            const parsedAmount = ethers.parseEther(amount.toString());
            const tx = await signer.sendTransaction({ to: toAddress, value: parsedAmount });
            txHash = tx.hash;
            txStatus = 'sent';
            
            onNewTransaction({
                hash: tx.hash,
                to: toAddress,
                amount: amount,
                type: 'Sent',
                timestamp: new Date().toISOString(),
                status: 'Confirmed'
            });

            const receipt = await tx.wait(1); 
            confirmations = receipt?.confirmations || 1;
            txStatus = 'confirmed';
            onTransactionConfirmed();
            amount = '';
            toAddress = '';
        } catch (err) {
            error = parseTransactionError(err);
            txStatus = 'error';
        } finally {
            loading = false;
        }
    }
</script>

<div class="dash-container" in:fade={{ duration: 400 }}>
    <header class="dash-header">
        <h2 class="cinzel">CENTRO DE OPERACIONES</h2>
        <p>Gestión de activos y transacciones en el Ecosistema de Redes.</p>
    </header>

    <!-- Tarjeta de Crédito Estilo Asta -->
    <div class="card-section">
        <div class="credit-card">
            <div class="cc-bg"></div>
            <div class="cc-content">
                <div class="cc-top">
                    <div class="cc-logo">
                        <svg viewBox="0 0 200 200" width="28" height="28">
                            <path d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" fill="currentColor"/>
                            <path d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" fill="currentColor"/>
                            <path d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" fill="currentColor"/>
                            <path d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" fill="currentColor"/>
                            <path d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" fill="currentColor" opacity="0.7"/>
                        </svg>
                        <span class="cinzel">BLACK-CORE</span>
                    </div>
                    <span class="cc-network">{activeNetworkName}</span>
                </div>
                <div class="cc-balance">
                    <span class="cc-amount">{nativeBalance}</span>
                    <span class="cc-ticker">{nativeTicker}</span>
                </div>
                <div class="cc-bottom">
                    <div class="cc-addr">
                        <span class="cc-label">DIRECCIÓN</span>
                        <span class="cc-value mono">{shortAddress(address)}</span>
                    </div>
                    <div class="cc-token">
                        <span class="cc-label">TOKEN</span>
                        <span class="cc-value">{formattedTokenBalance} {tokenSymbol}</span>
                    </div>
                    <div class="cc-chain">
                        <span class="cc-label">CHAIN</span>
                        <span class="cc-value">{chainId || '---'}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card gold">
            <div class="card-title cinzel">Dirección de Red</div>
            <div class="card-content">
                <span class="mono">{shortAddress(address)}</span>
                <button class="copy-btn" on:click={copyAddress}>{copied ? 'Copiado' : 'Copiar'}</button>
            </div>
            <div class="card-sub">{address}</div>
        </div>

        <div class="stat-card silver">
            <div class="card-title cinzel">Protocolo Activo</div>
            <div class="card-content">
                <span>{activeNetworkName}</span>
            </div>
            <div class="card-sub">Chain ID: {chainId || '---'}</div>
        </div>

        <div class="stat-card gold">
            <div class="card-title cinzel">Balance Nativo</div>
            <div class="card-content">
                <span class="val">{nativeBalance}</span>
                <span class="unit">{nativeTicker}</span>
            </div>
        </div>

        <div class="stat-card available">
            <div class="card-title cinzel">Activos del Núcleo</div>
            <div class="card-content">
                <span class="val accent">{formattedTokenBalance}</span>
                <span class="unit accent">{tokenSymbol}</span>
            </div>
        </div>
    </div>

    <div class="main-grid">
        <section class="transfer-section">
            <h3 class="cinzel">Transmisión de Activos</h3>
            <div class="form-body">
                <div class="input-field">
                    <label for="to">Dirección de Destino</label>
                    <input id="to" type="text" bind:value={toAddress} placeholder="0x..." />
                </div>
                <div class="input-field">
                    <label for="amount">Monto ({nativeTicker})</label>
                    <input id="amount" type="number" bind:value={amount} placeholder="0.00" />
                </div>
                
                {#if error}
                    <p class="error-text">{error}</p>
                {/if}

                {#if txHash}
                    <div class="tx-result">
                        <p>Tx Hash: <span class="mono">{shortAddress(txHash)}</span></p>
                        <a href="{getExplorerBase(chainId)}{txHash}" target="_blank">Ver en Explorer</a>
                    </div>
                {/if}

                <button class="action-btn" on:click={sendTx} disabled={loading || !toAddress || !amount}>
                    {loading ? 'Procesando...' : 'Ejecutar Transmisión'}
                </button>
            </div>
        </section>

        <section class="history-section">
            <h3 class="cinzel">Historial de Operaciones</h3>
            <div class="history-list">
                {#if history.length > 0}
                    {#each history as tx}
                        <div class="tx-item">
                            <div class="tx-type {tx.type.toLowerCase()}">{tx.type === 'Received' ? 'Recibido' : 'Enviado'}</div>
                            <div class="tx-details">
                                <span class="tx-amt">{Number(tx.amount).toFixed(4)} {tx.assetSymbol || nativeTicker}</span>
                                <span class="tx-date">{new Date(tx.timestamp).toLocaleDateString()}</span>
                            </div>
                            <a href="{(tx.explorerBase || getExplorerBase(tx.chainId)) + tx.hash}" target="_blank" class="tx-link">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                            </a>
                        </div>
                    {/each}
                {:else}
                    <p class="empty">Sin registros de actividad.</p>
                {/if}
            </div>
        </section>
    </div>
</div>


<style>
    .dash-container {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
    }

    .dash-header h2 {
        font-size: 1.8rem;
        margin: 0;
        color: var(--accent);
        text-shadow: 0 0 10px rgba(230, 0, 0, 0.3);
    }

    .dash-header p {
        color: var(--text-secondary);
        margin: 0.5rem 0 0;
    }

    /* ── Credit Card ── */
    .card-section {
        display: flex;
        justify-content: center;
    }

    .credit-card {
        width: 420px;
        height: 240px;
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(230,0,0,0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .credit-card:hover {
        transform: translateY(-5px) rotateX(2deg);
        box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(230,0,0,0.2);
    }

    .cc-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a0000 40%, #0d0d0d 70%, #0a0000 100%);
        border: 1px solid rgba(230,0,0,0.2);
        border-radius: 16px;
    }

    .cc-bg::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(230,0,0,0.08) 0%, transparent 70%);
        pointer-events: none;
    }

    .cc-content {
        position: relative;
        z-index: 1;
        padding: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: #fff;
    }

    .cc-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cc-logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--accent);
    }

    .cc-logo span {
        font-size: 0.75rem;
        letter-spacing: 0.15em;
    }

    .cc-network {
        font-size: 0.7rem;
        color: #888;
        background: rgba(255,255,255,0.05);
        padding: 0.25rem 0.6rem;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
    }

    .cc-balance {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .cc-amount {
        font-size: 2rem;
        font-weight: 800;
        color: #f0f0f0;
        font-family: 'JetBrains Mono', monospace;
    }

    .cc-ticker {
        font-size: 0.85rem;
        color: var(--accent);
        font-weight: 700;
    }

    .cc-bottom {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }

    .cc-label {
        display: block;
        font-size: 0.55rem;
        color: #999; /* Antes #666 - Más claro */
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.2rem;
    }

    .cc-value {
        font-size: 0.8rem;
        color: #eee; /* Antes #ccc - Más claro */
        font-weight: 600;
    }

    @media (max-width: 500px) {
        .credit-card { width: 100%; height: auto; min-height: 220px; }
    }


    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
    }

    .stat-card {
        background: var(--surface);
        border: 1px solid var(--border-color);
        padding: 1.5rem;
        border-radius: 4px;
        position: relative;
        overflow: hidden;
    }

    .stat-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 3px;
        background: var(--border-color);
    }

    .stat-card.gold::before { background: var(--accent); }
    .stat-card.silver::before { background: var(--accent-2); }
    .stat-card.available::before { background: var(--success); }

    .card-title {
        font-size: 0.75rem;
        color: #ddd; /* Antes var(--text-secondary) - Más brillante */
        text-transform: uppercase;
        margin-bottom: 1rem;
        letter-spacing: 0.05em;
    }

    .card-content {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }

    .card-content .val { color: #f5f5f5; } /* Antes var(--accent-2) - Blanco metálico */
    .card-content .val.accent { color: var(--accent); }
    .card-content .unit { font-size: 0.9rem; color: #aaa; }

    .card-sub {
        font-size: 0.75rem;
        color: #999; /* Antes var(--text-secondary) - Más contraste */
        font-family: 'JetBrains Mono', monospace;
        word-break: break-all;
    }

    .copy-btn {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        background: var(--surface-soft);
        border: 1px solid var(--border-color);
        color: var(--accent);
        cursor: pointer;
        border-radius: 4px;
    }

    .main-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    @media (max-width: 1000px) {
        .main-grid { grid-template-columns: 1fr; }
    }

    section {
        background: var(--surface);
        border: 1px solid var(--border-color);
        padding: 2rem;
        border-radius: 4px;
    }

    section h3 {
        margin: 0 0 1.5rem;
        font-size: 1.2rem;
        color: var(--accent);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.75rem;
    }

    .form-body {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .input-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-field label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        font-weight: 700;
    }

    .input-field input {
        background: var(--bg);
        border: 1px solid var(--border-color);
        padding: 0.8rem 1rem;
        color: var(--text-primary);
        border-radius: 4px;
        outline: none;
    }

    .input-field input:focus {
        border-color: var(--accent);
    }

    .action-btn {
        background: var(--accent);
        color: #000;
        border: none;
        padding: 1rem;
        font-weight: 700;
        cursor: pointer;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        transition: background 0.2s;
    }

    .action-btn:hover:not(:disabled) { background: var(--accent-dark); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .error-text { color: var(--error); font-size: 0.85rem; margin: 0; }

    .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 500px;
        overflow-y: auto;
    }

    .tx-item {
        background: var(--bg);
        border: 1px solid var(--border-color);
        padding: 1rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .tx-type {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
    }

    .tx-type.sent { color: var(--error); background: rgba(204, 0, 0, 0.1); }
    .tx-type.received { color: var(--success); background: rgba(0, 128, 0, 0.1); }

    .tx-details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
    }

    .tx-amt { font-weight: 700; color: var(--accent-2); }
    .tx-date { font-size: 0.75rem; color: var(--text-secondary); }

    .tx-link { color: var(--text-secondary); }
    .tx-link:hover { color: var(--accent); }

    .empty { text-align: center; color: var(--text-secondary); margin: 2rem 0; font-style: italic; }
    .mono { font-family: 'JetBrains Mono', monospace; }

    .tx-amount.received {
        color: var(--accent);
    }

    .tx-chain {
        margin-top: 0.14rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>

