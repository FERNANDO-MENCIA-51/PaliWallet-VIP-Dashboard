<script>
    import { fade, slide } from 'svelte/transition';
    import { ethers } from 'ethers';
    import { getExplorerBase, getNetworkName, getNetworkTicker } from './config/networks.js';
    import { isValidChecksumAddress, parseTransactionError } from '../composables/address.js';
    import { onMount } from 'svelte';

    export let balance = '';
    export let address = '';
    export let chainId = '';
    export let tokenBalance = '';
    /** @type {any[]} */
    export let history = [];
    export let historyLoading = false;
    /** @type {any} */
    export let signer = null;

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
    let gasPrice = '';
    let estimatedGasLimit = '21000';
    let estimatedTotalGas = '0';

    // Contract Interaction States
    let transferType = 'native'; // 'native' | 'contract'
    let contractAddress = '';
    let contractTokenName = '';

    $: activeNetworkName = chainId ? getNetworkName(chainId, address) : 'DESCONECTADO';
    $: nativeTicker = getNetworkTicker(chainId, address);
    $: nativeBalance = parseFloat(balance || '0').toFixed(6);
    $: formattedTokenBalance = parseFloat(tokenBalance || '0').toFixed(4);

    // Reactive Gas Estimation
    $: if (toAddress && amount && signer && chainId !== 'utxo') {
        updateGasEstimate();
    }

    async function updateGasEstimate() {
        if (!signer || !toAddress || !amount || parseFloat(amount) <= 0 || chainId === 'utxo') return;
        try {
            const provider = signer.provider;
            const feeData = await provider.getFeeData();
            gasPrice = ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
            
            const addrValidation = isValidChecksumAddress(toAddress);
            if (addrValidation.valid) {
                let estimate;
                if (transferType === 'native') {
                    estimate = await signer.estimateGas({
                        to: toAddress,
                        value: ethers.parseEther(amount.toString())
                    });
                } else if (isValidChecksumAddress(contractAddress).valid) {
                    const contract = new ethers.Contract(contractAddress, ["function transfer(address,uint256) public returns(bool)"], signer);
                    estimate = await contract.transfer.estimateGas(toAddress, ethers.parseUnits(amount.toString(), 18));
                } else {
                    estimate = 21000n;
                }
                
                estimatedGasLimit = estimate.toString();
                const total = (feeData.gasPrice || 0n) * estimate;
                estimatedTotalGas = ethers.formatEther(total);
            }
        } catch (err) {
            console.warn("Gas estimate failed", err);
        }
    }

    async function copyAddress() {
        if (!address) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(address);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            copied = true;
            setTimeout(() => copied = false, 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    }

    async function sendTx() {
        error = ''; txHash = ''; txStatus = 'idle';
        
        if (chainId === 'utxo') {
            error = 'El envío UTXO nativo debe realizarse desde Pali Wallet directamente en esta versión.';
            return;
        }

        if (!signer) { error = 'Billetera no detectada'; return; }

        const addrValidation = isValidChecksumAddress(toAddress);
        if (!addrValidation.valid) { error = 'Dirección de destino inválida'; return; }

        if (transferType === 'contract' && !isValidChecksumAddress(contractAddress).valid) {
            error = 'Dirección de contrato inválida'; return;
        }
        
        try {
            loading = true;
            txStatus = 'pending';
            
            let tx;
            if (transferType === 'native') {
                tx = await signer.sendTransaction({ 
                    to: toAddress, 
                    value: ethers.parseEther(amount.toString()) 
                });
            } else {
                // ERC20 Contract Transfer
                const contract = new ethers.Contract(
                    contractAddress, 
                    ["function transfer(address to, uint256 amount) public returns (bool)", "function symbol() view returns (string)"], 
                    signer
                );
                
                let symbol = 'TOKEN';
                try { symbol = await contract.symbol(); } catch(e) {}
                
                tx = await contract.transfer(toAddress, ethers.parseUnits(amount.toString(), 18));
                contractTokenName = symbol;
            }

            txHash = tx.hash;
            txStatus = 'sent';
            
            onNewTransaction({
                hash: tx.hash, to: toAddress, amount: amount, 
                type: transferType === 'native' ? 'Sent' : 'Contract Call',
                timestamp: new Date().toISOString(), status: 'Confirmed',
                assetSymbol: transferType === 'native' ? nativeTicker : contractTokenName
            });

            await tx.wait(1); 
            txStatus = 'confirmed';
            onTransactionConfirmed();
            amount = ''; toAddress = '';
        } catch (err) {
            error = parseTransactionError(err);
            txStatus = 'error';
        } finally {
            loading = false;
        }
    }

    /** @param {string} addr */
    function shortAddress(addr) {
        if (!addr) return '---';
        if (addr.length <= 13) return addr;
        return addr.slice(0, 8) + '...' + addr.slice(-6);
    }
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-8" in:fade>
    
    <!-- VIP SECTION -->
    <div class="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div class="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[#1a1a1a] to-[#000000] border border-white/10 p-10 shadow-2xl group">
            <div class="absolute top-0 right-0 w-64 h-64 bg-anti-accent/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            <div class="relative h-full flex flex-col justify-between gap-12">
                <div class="flex justify-between items-start">
                    <div class="flex flex-col gap-1">
                        <span class="text-anti-accent font-black tracking-[0.3em] text-[10px] uppercase">Fernando Dev VIP Member</span>
                        <h2 class="text-white font-cinzel text-3xl font-black tracking-tight">PREMIUM TERMINAL</h2>
                    </div>
                    <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                         <svg class="w-6 h-6 text-anti-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"></path></svg>
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-4">
                        <span class="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Balance Nativo</span>
                        <button 
                            on:click={onTransactionConfirmed} 
                            class="p-1.5 hover:bg-white/5 rounded-lg transition-colors group/refresh"
                            title="Sincronizar Datos"
                        >
                            <svg class="w-3 h-3 text-white/40 group-hover/refresh:text-anti-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-baseline gap-4">
                        <span class="text-5xl lg:text-7xl font-cinzel font-black text-white">{nativeBalance}</span>
                        <span class="text-xl font-black text-anti-accent tracking-widest">{nativeTicker}</span>
                    </div>
                </div>
                <div class="flex items-end justify-between">
                    <div class="flex flex-col gap-1">
                        <span class="text-white/40 text-[9px] font-black uppercase tracking-widest">ID de Billetera</span>
                        <div class="flex items-center gap-4">
                            <span class="text-anti-silver font-mono text-sm tracking-wider">{shortAddress(address)}</span>
                            <button on:click={copyAddress} class="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-anti-accent transition-all group/copy">
                                <svg class="w-4 h-4 {copied ? 'text-green-500' : 'text-white/40 group-hover/copy:text-white'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {#if copied} <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    {:else} <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/> {/if}
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="block text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Red Activa</span>
                        <div class="px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full inline-flex items-center gap-2">
                             <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                             <span class="text-[10px] font-black text-green-500 uppercase tracking-tighter">{activeNetworkName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gas Estimator -->
        <div class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute inset-0 bg-linear-to-b from-anti-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-anti-border group-hover:border-anti-accent transition-colors">
                    <svg class="w-6 h-6 text-anti-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Estimación de Gas</span>
            </div>
            <div class="flex flex-col gap-4">
                <div class="space-y-1">
                    <span class="text-white/40 text-[9px] font-black uppercase tracking-widest">Costo de Red</span>
                    <div class="text-2xl font-cinzel font-black text-white">{parseFloat(estimatedTotalGas).toFixed(8)} <span class="text-xs text-anti-accent">{nativeTicker}</span></div>
                </div>
                <div class="flex gap-6 border-t border-anti-border pt-4">
                    <div class="space-y-0.5">
                        <span class="text-[8px] font-black text-white/40 uppercase">Gwei</span>
                        <div class="text-xs font-mono text-anti-silver">{parseFloat(gasPrice || '0').toFixed(2)}</div>
                    </div>
                    <div class="space-y-0.5">
                        <span class="text-[8px] font-black text-white/40 uppercase">Limit</span>
                        <div class="text-xs font-mono text-anti-silver">{estimatedGasLimit}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Transfer Panel -->
    <div class="lg:col-span-7 flex flex-col gap-8">
        <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
            <div class="flex items-center justify-between mb-10">
                <div class="flex items-center gap-4">
                    <div class="w-1.5 h-8 bg-anti-accent rounded-full"></div>
                    <h2 class="font-cinzel text-3xl font-black text-white uppercase tracking-tight">Transferencia</h2>
                </div>
                
                <!-- Transfer Type Toggle -->
                <div class="flex bg-black p-1 rounded-xl border border-anti-border">
                    <button on:click={() => transferType = 'native'} class="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all {transferType === 'native' ? 'bg-anti-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}">NATIVO</button>
                    <button on:click={() => transferType = 'contract'} class="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all {transferType === 'contract' ? 'bg-anti-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}">CONTRATO</button>
                </div>
            </div>

            <div class="space-y-6">
                {#if transferType === 'contract'}
                    <div class="space-y-3" transition:slide>
                        <label for="contractAddress" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4">Dirección del Contrato (ERC20)</label>
                        <input id="contractAddress" type="text" bind:value={contractAddress} placeholder="0x... (Contrato del Token)" class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-sm" />
                    </div>
                {/if}

                <div class="space-y-3">
                    <label for="toAddress" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4">Dirección de Destino (Cuenta)</label>
                    <input id="toAddress" type="text" bind:value={toAddress} placeholder="0x... (Cuenta del Receptor)" class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-sm" />
                </div>

                <div class="space-y-3">
                    <label for="amount" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4">Monto a Enviar</label>
                    <div class="relative">
                        <input id="amount" type="number" bind:value={amount} placeholder="0.00" class="w-full bg-black border border-anti-border rounded-2xl px-6 py-5 text-white focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-2xl" />
                        <div class="absolute right-6 top-1/2 -translate-y-1/2 text-anti-accent font-black tracking-widest">{transferType === 'native' ? nativeTicker : 'TOKENS'}</div>
                    </div>
                </div>

                {#if error}
                    <div class="p-4 bg-red-900/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase" transition:slide>{error}</div>
                {/if}

                {#if txHash}
                    <div class="p-5 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between" transition:slide>
                        <div>
                            <span class="block text-[10px] font-black text-green-500 uppercase">Transacción Exitosa</span>
                            <span class="text-[9px] text-white/40 font-mono">{txHash.slice(0, 20)}...</span>
                        </div>
                        <a href="{getExplorerBase(chainId)}{txHash}" target="_blank" class="px-5 py-2.5 bg-green-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Ver Detalle</a>
                    </div>
                {/if}

                <button on:click={sendTx} disabled={loading || !toAddress || !amount || (transferType === 'contract' && !contractAddress)} class="w-full py-6 bg-white text-black font-black font-cinzel text-xl rounded-2xl hover:bg-anti-accent hover:text-white transition-all duration-500 disabled:opacity-20 shadow-2xl">
                    {loading ? 'PROCESANDO...' : 'EJECUTAR TRANSACCIÓN'}
                </button>
            </div>
        </section>
    </div>

    <!-- Sidebar Activity -->
    <div class="lg:col-span-5">
        <section class="bg-anti-surface/50 border border-anti-border rounded-[2.5rem] p-10 h-full flex flex-col shadow-xl">
            <h3 class="font-cinzel text-xl font-black text-white uppercase tracking-tight mb-10">Actividad Reciente</h3>
            <div class="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {#if historyLoading}
                    <div class="flex flex-col gap-4 animate-pulse">
                        {#each Array(4) as _}
                            <div class="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
                        {/each}
                    </div>
                {:else if history.length > 0}
                    {#each history as tx}
                        <a 
                            href="{tx.explorerBase || getExplorerBase(chainId)}{tx.hash}" 
                            target="_blank" 
                            class="bg-black/60 border border-anti-border p-5 rounded-2xl flex items-center justify-between group hover:border-anti-accent transition-all cursor-pointer"
                        >
                            <div class="flex items-center gap-5">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center 
                                    {tx.type === 'Received' || tx.type === 'Recibido' ? 'bg-green-500/10 text-green-500' : 'bg-anti-accent/10 text-anti-accent'}">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d={tx.type === 'Received' || tx.type === 'Recibido' ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'}/>
                                    </svg>
                                </div>
                                <div>
                                    <div class="text-xs font-black text-white uppercase tracking-widest">
                                        {tx.type}
                                    </div>
                                    <div class="text-[10px] text-white/40 font-mono">{new Date(tx.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-6">
                                <div class="text-right">
                                    <div class="text-lg font-black font-cinzel {tx.type === 'Received' || tx.type === 'Recibido' ? 'text-green-500' : 'text-white'}">
                                        {tx.type === 'Received' || tx.type === 'Recibido' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)}
                                    </div>
                                    <div class="text-[10px] text-white/40 font-black uppercase">{tx.assetSymbol || nativeTicker}</div>
                                </div>
                                <div class="p-2 bg-white/5 rounded-lg group-hover:bg-anti-accent transition-colors">
                                    <svg class="w-4 h-4 text-white/40 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                    </svg>
                                </div>
                            </div>
                        </a>
                    {/each}
                {:else}
                    <div class="flex flex-col items-center justify-center h-60 opacity-20">
                        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p class="text-[10px] font-black uppercase tracking-[0.3em]">Sin actividad reciente</p>
                    </div>
                {/if}
            </div>
        </section>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e60000; }
</style>