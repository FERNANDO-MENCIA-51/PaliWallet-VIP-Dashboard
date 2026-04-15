<script>
    import { ethers } from 'ethers';
    import { fade } from 'svelte/transition';

    export let signer = null;
    export let connected = false;
    export let explorerBase = '';
    export let balance = '';
    export let chainId = '';

    let toAddress = '';
    let amount = '';
    let loading = false;
    let txHash = '';
    let error = '';
    let gasEstimate = '';
    let gasLoading = false;
    let gasPriceGwei = '';
    let gasCostEth = '';
    let feeMode = '';
    let txStatus = 'idle';
    let confirmations = 0;

    export let onTransactionConfirmed = () => {};
    export let onNewTransaction = (tx) => {};

    const supportedChainIds = ['57', '570', '5700', '57000', '1', '11155111', '137', '56', '43114'];

    function isBalanceReady() {
        const numericBalance = Number(balance);
        return Number.isFinite(numericBalance) && numericBalance >= 0;
    }

    async function estimateGas() {
        gasEstimate = '';
        gasPriceGwei = '';
        gasCostEth = '';
        feeMode = '';
        if (!signer || !ethers.isAddress(toAddress)) return;
        if (!amount || Number(amount) <= 0) return;
        try {
            gasLoading = true;
            const parsedAmount = ethers.parseEther(amount.toString());
            const estimate = await signer.estimateGas({
                to: toAddress,
                value: parsedAmount
            });
            gasEstimate = estimate.toString();

            const provider = signer.provider;
            if (provider) {
                const feeData = await provider.getFeeData();
                const price = feeData.maxFeePerGas || feeData.gasPrice;
                if (price) {
                    gasPriceGwei = ethers.formatUnits(price, 'gwei');
                    feeMode = feeData.maxFeePerGas ? 'max' : 'legacy';
                    const costWei = estimate * price;
                    gasCostEth = ethers.formatEther(costWei);
                }
            }
        } catch (err) {
            gasEstimate = '';
            gasPriceGwei = '';
            gasCostEth = '';
            feeMode = '';
        } finally {
            gasLoading = false;
        }
    }

    async function sendTx() {
        error = '';
        txHash = '';
        txStatus = 'idle';
        confirmations = 0;
        
        if (!signer) {
            error = 'Billetera no conectada.';
            return;
        }

        const currentAddr = await signer.getAddress();
        if (toAddress.toLowerCase() === currentAddr.toLowerCase()) {
            if (!confirm('Estás enviando fondos a tu propia dirección. ¿Deseas continuar?')) {
                return;
            }
        }

        if (!ethers.isAddress(toAddress)) {
            error = 'Dirección de destino inválida.';
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            error = 'Monto inválido.';
            return;
        }

        if (!supportedChainIds.includes(chainId)) {
            error = 'Red no compatible. Cambia a una red EVM soportada.';
            return;
        }

        if (!isBalanceReady()) {
            error = 'Balance aun no disponible. Espera unos segundos y reintenta.';
            return;
        }

        const numericBalance = Number(balance);
        if (!Number.isNaN(numericBalance) && Number(amount) > numericBalance) {
            error = 'Saldo insuficiente para esta transferencia.';
            return;
        }

        if (!gasEstimate) {
            await estimateGas();
        }

        try {
            loading = true;
            txStatus = 'pending';
            const parsedAmount = ethers.parseEther(amount.toString());
            const tx = await signer.sendTransaction({
                to: toAddress,
                value: parsedAmount
            });
            txHash = tx.hash;
            txStatus = 'sent';
            
            onNewTransaction({
                hash: tx.hash,
                to: toAddress,
                amount: amount,
                type: 'Sent'
            });

            // Esperar confirmación para actualizar el Dashboard
            const receipt = await tx.wait(1); 
            confirmations = receipt?.confirmations || 1;
            txStatus = 'confirmed';
            onTransactionConfirmed();
        } catch (err) {
            error = err.reason || err.message || 'Error al enviar la transacción.';
            txStatus = 'error';
        } finally {
            loading = false;
        }
    }

    function openExplorer() {
        const base = explorerBase || 'https://explorer.syscoin.org/tx/';
        window.open(`${base}${txHash}`, '_blank');
    }
</script>

<div class="transfer-pane appear" in:fade={{ duration: 400 }}>
    <div class="header-sec">
        <h3>Transferencia P2P</h3>
        <p>Envía fondos directamente de cuenta a cuenta, confirmación en cadena.</p>
    </div>

    <!-- TODO: Transfer Form -->
    {#if !connected}
        <div class="warning-box">
            <span>⚠️</span> Conecta tu billetera para realizar transferencias.
        </div>
    {:else}
        <div class="form-card">
            <div class="input-group">
                <label for="to">Dirección de Destino</label>
                <div class="input-wrapper">
                    <span class="prefix">To:</span>
                    <input id="to" type="text" bind:value={toAddress} placeholder="0x..." on:blur={estimateGas} />
                </div>
            </div>

            <div class="input-group">
                <label for="amount">Monto (SYS/ETH)</label>
                <div class="input-wrapper">
                    <span class="prefix">Val:</span>
                    <input id="amount" type="number" bind:value={amount} placeholder="0.00" min="0" step="0.0001" on:blur={estimateGas} />
                </div>
            </div>

            <div class="gas-row">
                <span>Gas estimado:</span>
                {#if gasLoading}
                    <span class="gas-value">Calculando...</span>
                {:else if gasEstimate}
                    <span class="gas-value">{gasEstimate} unidades</span>
                {:else}
                    <span class="gas-value muted">No disponible</span>
                {/if}
            </div>

            <div class="gas-row">
                <span>Costo estimado:</span>
                {#if gasLoading}
                    <span class="gas-value">Calculando...</span>
                {:else if gasCostEth}
                    <span class="gas-value">{Number(gasCostEth).toFixed(6)} ETH</span>
                {:else}
                    <span class="gas-value muted">No disponible</span>
                {/if}
            </div>

            <div class="gas-row">
                <span>Gas price:</span>
                {#if gasLoading}
                    <span class="gas-value">Calculando...</span>
                {:else if gasPriceGwei}
                    <span class="gas-value">{Number(gasPriceGwei).toFixed(2)} gwei {feeMode === 'max' ? '(max)' : ''}</span>
                {:else}
                    <span class="gas-value muted">No disponible</span>
                {/if}
            </div>

            <button class="btn-send" on:click={sendTx} disabled={loading || !toAddress || !amount}>
                {#if loading}
                    <span class="spinner"></span> Enviando...
                {:else}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Confirmar Envío
                {/if}
            </button> <!-- Error Handler -->
            {#if error}
                <div class="error-msg">{error}</div>
            {/if}
        </div>

        <div class="status-card">
            <div class="status-row">
                <span>Estado:</span>
                <span class="status-pill {txStatus}">
                    {txStatus === 'idle' ? 'Listo' : ''}
                    {txStatus === 'pending' ? 'Pendiente' : ''}
                    {txStatus === 'sent' ? 'Enviada' : ''}
                    {txStatus === 'confirmed' ? 'Confirmada' : ''}
                    {txStatus === 'error' ? 'Error' : ''}
                </span>
            </div>
            <div class="status-row">
                <span>Red:</span>
                <span class="status-value">{chainId ? `Chain ID ${chainId}` : 'No conectada'}</span>
            </div>
            <div class="status-row">
                <span>Gas:</span>
                <span class="status-value">
                    {gasEstimate ? `${gasEstimate} unidades` : 'No disponible'}
                    {gasCostEth ? ` · ${Number(gasCostEth).toFixed(6)} ETH` : ''}
                </span>
            </div>
            <div class="status-row">
                <span>Confirmaciones:</span>
                <span class="status-value">{confirmations}</span>
            </div>
            <div class="status-row hash">
                <span>Hash:</span>
                <span class="status-mono">{txHash ? txHash : '---'}</span>
            </div>
            {#if txHash}
                <button class="btn-explorer" on:click={openExplorer}>Ver detalle en explorer</button>
            {/if}
        </div>

        <!-- Hash Display -->
        {#if txHash}
            <div class="hash-box appear">
                <div class="success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="hash-content">
                    <h4>¡Transacción Enviada!</h4>
                    <p class="mono">{txHash}</p>
                    <button class="btn-explorer" on:click={openExplorer}>
                        Ver en Explorer
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .transfer-pane { text-align: left; }
    
    .header-sec { margin-bottom: 1.5rem; }
    .header-sec h3 {
        margin: 0 0 0.2rem;
        font-size: 1.25rem;
        color: var(--platinum);
    }
    .header-sec p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--muted);
    }

    .warning-box {
        background: rgba(255, 171, 0, 0.1);
        border: 1px solid rgba(255, 171, 0, 0.2);
        color: #ffab00;
        padding: 1rem;
        border-radius: 12px;
        font-size: 0.9rem;
    }

    .form-card {
        background: rgba(240, 242, 246, 0.03);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-group label {
        font-size: 0.8rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }

    .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        background: rgba(18, 22, 29, 0.8);
        border: 1px solid var(--border-2);
        border-radius: 12px;
        transition: border-color 0.2s;
        overflow: hidden;
    }

    .input-wrapper:focus-within { border-color: rgba(240, 242, 246, 0.3); }

    .prefix {
        padding-left: 1rem;
        color: var(--muted-2);
        font-family: monospace;
        font-size: 0.8rem;
        user-select: none;
    }

    input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 0.9rem 1rem;
        color: var(--text);
        font-size: 0.95rem;
        font-family: 'Courier New', monospace;
        outline: none;
    }

    .btn-send {
        background: rgba(0, 208, 142, 0.12);
        border: 1px solid rgba(0, 208, 142, 0.3);
        color: var(--good);
        border-radius: 12px;
        padding: 0.9rem;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        margin-top: 0.5rem;
    }

    .btn-send:hover:not(:disabled) {
        background: rgba(0, 208, 142, 0.18);
        box-shadow: 0 4px 14px rgba(0, 208, 142, 0.2);
    }
    
    .btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spinner {
        width: 16px; height: 16px;
        border: 2px solid rgba(61, 220, 151, 0.2);
        border-top-color: var(--good);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    .error-msg {
        color: var(--bad);
        font-size: 0.8rem;
        text-align: center;
        background: rgba(255, 107, 107, 0.08);
        padding: 0.5rem;
        border-radius: 8px;
    }

    .hash-box {
        margin-top: 1.5rem;
        background: rgba(61, 220, 151, 0.05);
        border: 1px solid rgba(61, 220, 151, 0.2);
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .success-icon {
        width: 40px; height: 40px;
        background: rgba(61, 220, 151, 0.1);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
    }

    .hash-content h4 { margin: 0 0 0.3rem; color: var(--good); font-size: 1rem; }
    .hash-content .mono {
        margin: 0 0 0.8rem;
        font-size: 0.75rem;
        color: var(--muted);
        word-break: break-all;
    }

    .btn-explorer {
        background: rgba(240, 242, 246, 0.08);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-explorer:hover { background: rgba(240, 242, 246, 0.12); }

    .status-card {
        margin-top: 1.2rem;
        background: rgba(240, 242, 246, 0.04);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1rem 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        color: var(--muted);
        gap: 0.8rem;
    }

    .status-row.hash {
        align-items: flex-start;
    }

    .status-value {
        color: var(--platinum);
        font-weight: 600;
    }

    .status-mono {
        color: var(--muted);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        word-break: break-all;
        text-align: right;
    }

    .status-pill {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        background: rgba(240, 242, 246, 0.08);
        color: var(--platinum);
    }

    .status-pill.pending { background: rgba(255, 171, 0, 0.15); color: #ffab00; }
    .status-pill.sent { background: rgba(0, 183, 255, 0.15); color: #00b7ff; }
    .status-pill.confirmed { background: rgba(0, 208, 142, 0.15); color: #00d08e; }
    .status-pill.error { background: rgba(255, 85, 85, 0.15); color: var(--bad); }

    .gas-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: var(--muted);
        background: rgba(240, 242, 246, 0.04);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.6rem 0.75rem;
    }

    .gas-value {
        font-weight: 600;
        color: var(--platinum);
    }

    .gas-value.muted {
        color: var(--muted-2);
        font-weight: 500;
    }

    .appear { animation: fadeUp 400ms ease-out both; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to {opacity:1; transform:translateY(0);} }
</style>
