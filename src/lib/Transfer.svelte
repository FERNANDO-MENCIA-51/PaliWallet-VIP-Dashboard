<script>
    import { ethers } from 'ethers';
    import { fade } from 'svelte/transition';
    import { SUPPORTED_EVM_CHAIN_IDS, getNetworkTicker } from './config/networks.js';
    import { isValidChecksumAddress, parseTransactionError } from '../composables/address.js';

    /** @type {any} */
    export let signer = null;
    export let connected = false;
    export let explorerBase = '';
    export let chainId = '';

    let toAddress = '';
    let amount = '';
    let loading = false;
    let txHash = '';
    let error = '';
    let gasEstimate = '';
    let gasLoading = false;
    let txStatus = 'idle';

    export let onTransactionConfirmed = () => {};
    /** @type {(tx: any) => void} */
    export let onNewTransaction = (tx) => {};

    $: nativeTicker = getNetworkTicker(chainId);

    async function estimateGas() {
        if (!signer || !ethers.isAddress(toAddress)) return;
        if (!amount || Number(amount) <= 0) return;
        try {
            gasLoading = true;
            const estimate = await signer.estimateGas({
                to: toAddress,
                value: ethers.parseEther(amount.toString())
            });
            gasEstimate = estimate.toString();
        } catch (err) {
            gasEstimate = '';
        } finally {
            gasLoading = false;
        }
    }

    async function sendTx() {
        error = ''; txHash = ''; txStatus = 'idle';
        if (!signer) { error = 'Magic Seal Broken'; return; }

        const addrValidation = isValidChecksumAddress(toAddress);
        if (!addrValidation.valid) { error = 'Invalid Vector'; return; }

        try {
            loading = true;
            txStatus = 'pending';
            const tx = await signer.sendTransaction({
                to: toAddress,
                value: ethers.parseEther(amount.toString())
            });
            txHash = tx.hash;
            txStatus = 'sent';
            
            onNewTransaction({
                hash: tx.hash, to: toAddress, amount: amount, type: 'Sent'
            });

            await tx.wait(1); 
            txStatus = 'confirmed';
            onTransactionConfirmed();
        } catch (err) {
            error = parseTransactionError(err);
            txStatus = 'error';
        } finally {
            loading = false;
        }
    }
</script>

<div class="bg-anti-surface border border-anti-border rounded-3xl p-8 max-w-2xl mx-auto" in:fade>
    <div class="flex items-center gap-3 mb-8">
        <div class="w-1 h-6 bg-anti-accent rounded-full"></div>
        <h3 class="font-cinzel text-xl font-black text-white uppercase tracking-wider">Corte Dimensional P2P</h3>
    </div>

    {#if !connected}
        <div class="p-6 bg-anti-accent/5 border border-anti-accent/20 rounded-2xl text-anti-accent text-sm font-bold text-center">
             ⚠️ Sincroniza tu Grimorio para habilitar transferencias.
        </div>
    {:else}
        <div class="space-y-6">
            <div class="space-y-2">
                <label for="toAddress" class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Vector de Destino</label>
                <input 
                    id="toAddress"
                    type="text" 
                    bind:value={toAddress} 
                    on:blur={estimateGas}
                    placeholder="0x..." 
                    class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white focus:border-anti-accent outline-none transition-all font-mono"
                />
            </div>

            <div class="space-y-2">
                <label for="amount" class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Magnitud ({nativeTicker})</label>
                <input 
                    id="amount"
                    type="number" 
                    bind:value={amount} 
                    on:blur={estimateGas}
                    placeholder="0.00" 
                    class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white focus:border-anti-accent outline-none transition-all font-mono"
                />
            </div>

            <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2">
                <span>Gas Requerido:</span>
                <span class="text-anti-silver">{gasLoading ? 'Analizando...' : (gasEstimate || 'N/D')}</span>
            </div>

            {#if error}
                <div class="p-4 bg-red-900/10 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black uppercase">
                    Error: {error}
                </div>
            {/if}

            <button 
                on:click={sendTx} 
                disabled={loading || !toAddress || !amount}
                class="w-full py-4 bg-white text-black font-black font-cinzel text-lg rounded-2xl hover:bg-anti-accent hover:text-white transition-all duration-500 disabled:opacity-20"
            >
                {loading ? 'CANALIZANDO...' : 'CONFIRMAR CORTE'}
            </button>

            {#if txHash}
                <div class="mt-8 p-6 bg-black/50 border border-anti-accent/30 rounded-2xl flex flex-col items-center gap-4 text-center">
                    <div class="w-12 h-12 bg-anti-accent rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(230,0,0,0.5)]">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                        <h4 class="font-cinzel text-white font-bold mb-1">Impacto Exitoso</h4>
                        <p class="text-[10px] font-mono text-gray-500 break-all">{txHash}</p>
                    </div>
                    <a href="{explorerBase}{txHash}" target="_blank" class="text-[10px] font-black uppercase tracking-[0.2em] text-anti-accent hover:underline">
                        Ver en el Ledger
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>
