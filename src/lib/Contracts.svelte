<script>
    // @ts-nocheck
    import { fade, slide } from "svelte/transition";
    import { ethers } from "ethers";
    import { onMount } from "svelte";
    import { getExplorerBase } from "./config/networks.js";
    import { isValidChecksumAddress, parseTransactionError } from "../composables/address.js";

    // Session props from App.svelte
    export let address = "";
    export let chainId = "";
    export let connected = false;
    export let signer = null;
    export let provider = null;

    // --- CARD 1: FERNANDODEV Token State ---
    let fdevContractInput = "";
    let fdevTokenAddress = "";
    let fdevTokenLoaded = false;
    let fdevTokenLoading = false;
    let fdevTokenError = "";
    let fdevTokenInfo = {
        name: "---",
        symbol: "---",
        decimals: 18,
        totalSupply: "0",
        balance: "0",
        owner: ""
    };
    


    // --- CARD 2: Admin State & Verification ---
    let isAdminVerified = false;
    let isOwner = false;
    let ownerVerificationError = "";
    let ownerVerificationLoading = false;

    let mintToAddress = "";
    let mintAmount = "";
    let mintLoading = false;
    let mintError = "";
    let mintTxHash = "";
    let mintTxStatus = "idle";

    let burnAmount = "";
    let burnLoading = false;
    let burnError = "";
    let burnTxHash = "";
    let burnTxStatus = "idle";





    const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 value) returns (bool)",
        "function mint(address to, uint256 amount) returns (bool)",
        "function burn(uint256 amount) returns (bool)",
        "function owner() view returns (address)"
    ];

    // Reactive hooks to refresh balances when connection or chain changes
    $: if (connected && address && chainId && (provider || signer)) {
        if (fdevTokenLoaded) loadFdevToken(fdevTokenAddress, true);
        // If wallet just connected and we have saved addresses but haven't loaded yet, load them
        if (!fdevTokenLoaded && fdevContractInput) loadFdevToken(fdevContractInput, true);
    }

    // Reset verification when connected account changes
    $: if (address) {
        isAdminVerified = false;
        isOwner = false;
        ownerVerificationError = "";
    }

    // --- onMount Address Persistence ---
    onMount(() => {
        // Only restore saved addresses into inputs; actual loading will happen
        // reactively once provider/signer become available via the $: block above.
        const savedFdev = localStorage.getItem("fdev_token_address");
        if (savedFdev) fdevContractInput = savedFdev;
    });

    // --- Helper for copying address ---
    let copiedText = "";
    function copyText(text, label) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copiedText = label;
            setTimeout(() => {
                copiedText = "";
            }, 2000);
        });
    }

    // --- Add Token to Metamask/Pali ---
    async function watchAsset(tokenAddr, symbol, decimals) {
        try {
            const eth = window["ethereum"];
            if (!eth) return;
            await eth.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddr,
                        symbol: symbol,
                        decimals: decimals,
                        image: '',
                    },
                },
            });
        } catch (err) {
            console.error("Error watching asset:", err);
        }
    }

    // --- Load FERNANDODEV Token Metadata & Save in localStorage ---
    async function handleSaveFdevToken() {
        fdevContractInput = fdevContractInput.trim();
        if (!fdevContractInput) return;
        if (!ethers.isAddress(fdevContractInput)) {
            fdevTokenError = "Dirección de contrato inválida";
            return;
        }
        await loadFdevToken(fdevContractInput);
        if (fdevTokenLoaded) {
            localStorage.setItem("fdev_token_address", fdevContractInput);
        }
    }

    async function loadFdevToken(tokenAddr, silent = false) {
        if (!silent) {
            fdevTokenLoading = true;
            fdevTokenError = "";
        }
        try {
            const activeProvider = provider || (signer ? signer.provider : null);
            if (!activeProvider) throw new Error("No hay proveedor disponible");

            const contract = new ethers.Contract(tokenAddr, ERC20_ABI, activeProvider);
            
            // Check if address has code
            const code = await activeProvider.getCode(tokenAddr);
            if (code === "0x" || code === "0x0") {
                throw new Error("La dirección no contiene un contrato inteligente");
            }

            const [name, symbol, decimals, totalSupply, bal, owner] = await Promise.all([
                contract.name().catch(() => "Unknown"),
                contract.symbol().catch(() => "UNK"),
                contract.decimals().catch(() => 18n),
                contract.totalSupply().catch(() => 0n),
                address ? contract.balanceOf(address).catch(() => 0n) : 0n,
                contract.owner().catch(() => ethers.ZeroAddress)
            ]);

            const dec = Number(decimals);
            fdevTokenInfo = {
                name,
                symbol,
                decimals: dec,
                totalSupply: ethers.formatUnits(totalSupply, dec),
                balance: ethers.formatUnits(bal, dec),
                owner
            };
            fdevTokenAddress = tokenAddr;
            fdevTokenLoaded = true;
        } catch (err) {
            console.error(err);
            fdevTokenError = err.message || "Error al cargar metadata de FERNANDODEV. Verifica la dirección.";
            fdevTokenLoaded = false;
        } finally {
            fdevTokenLoading = false;
        }
    }



    // --- Verify Owner ---
    async function verifyOwnership() {
        ownerVerificationError = "";
        if (!signer) {
            ownerVerificationError = "Billetera no conectada";
            return;
        }
        if (!fdevTokenInfo.owner || fdevTokenInfo.owner === ethers.ZeroAddress) {
            ownerVerificationError = "No se ha detectado propietario en este contrato";
            return;
        }
        ownerVerificationLoading = true;
        try {
            const userAddress = await signer.getAddress();
            if (userAddress.toLowerCase() === fdevTokenInfo.owner.toLowerCase()) {
                isOwner = true;
                isAdminVerified = true;
            } else {
                isOwner = false;
                isAdminVerified = false;
                ownerVerificationError = "La cuenta conectada no es la propietaria (Owner) de este contrato.";
            }
        } catch (err) {
            ownerVerificationError = "Error al verificar ownership del contrato";
        } finally {
            ownerVerificationLoading = false;
        }
    }

    // --- Admin: Mint Tokens ---
    async function runMint() {
        mintError = ""; mintTxHash = ""; mintTxStatus = "idle";
        if (!signer) { mintError = "Billetera no conectada"; return; }
        const validation = isValidChecksumAddress(mintToAddress);
        if (!validation.valid) { mintError = "Destinatario inválido"; return; }
        if (!mintAmount || parseFloat(mintAmount) <= 0) { mintError = "Monto inválido"; return; }

        try {
            mintLoading = true;
            mintTxStatus = "pending";
            const contract = new ethers.Contract(fdevTokenAddress, ERC20_ABI, signer);
            const amt = ethers.parseUnits(mintAmount.toString(), fdevTokenInfo.decimals);
            
            const tx = await contract.mint(mintToAddress, amt);
            mintTxHash = tx.hash;
            mintTxStatus = "sent";

            await tx.wait(1);
            mintTxStatus = "confirmed";
            mintAmount = ""; mintToAddress = "";
            await loadFdevToken(fdevTokenAddress, true);
        } catch (err) {
            console.error(err);
            mintError = parseTransactionError(err);
            mintTxStatus = "error";
        } finally {
            mintLoading = false;
        }
    }

    // --- Admin: Burn Tokens ---
    async function runBurn() {
        burnError = ""; burnTxHash = ""; burnTxStatus = "idle";
        if (!signer) { burnError = "Billetera no conectada"; return; }
        if (!burnAmount || parseFloat(burnAmount) <= 0) { burnError = "Monto inválido"; return; }

        try {
            burnLoading = true;
            burnTxStatus = "pending";
            const contract = new ethers.Contract(fdevTokenAddress, ERC20_ABI, signer);
            const amt = ethers.parseUnits(burnAmount.toString(), fdevTokenInfo.decimals);
            
            const tx = await contract.burn(amt);
            burnTxHash = tx.hash;
            burnTxStatus = "sent";

            await tx.wait(1);
            burnTxStatus = "confirmed";
            burnAmount = "";
            await loadFdevToken(fdevTokenAddress, true);
        } catch (err) {
            console.error(err);
            burnError = parseTransactionError(err);
            burnTxStatus = "error";
        } finally {
            burnLoading = false;
        }
    }




</script>

<div class="grid grid-cols-1 xl:grid-cols-2 gap-8" in:fade>
    <!-- Left Column -->
    <div class="flex flex-col gap-8">
        
        <!-- CARD 1: FERNANDODEV Token -->
        <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl group">
            <div class="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            
            <!-- Header -->
            <div class="flex items-center gap-5 mb-8">
                <div class="w-14 h-14 bg-anti-accent/10 rounded-2xl flex items-center justify-center border border-anti-accent/20 text-anti-accent shadow-[0_0_15px_rgba(230,0,0,0.15)]">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-white font-cinzel text-xl font-black tracking-tight">FERNANDODEV</h3>
                    <p class="text-[10px] text-anti-accent font-black uppercase tracking-wider">Tu token ERC-20 personal</p>
                </div>
            </div>

            <!-- Input Contract Address & Save -->
            <div class="space-y-3 mb-6">
                <label for="fdevContractInput" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4 font-mono">DIRECCIÓN DEL CONTRATO</label>
                <div class="flex gap-2">
                    <input 
                        id="fdevContractInput"
                        type="text" 
                        bind:value={fdevContractInput} 
                        placeholder="0x... (Contrato de FERNANDODEV Token)" 
                        class="flex-1 bg-black border border-anti-border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-sm" 
                    />
                    <button 
                        on:click={handleSaveFdevToken}
                        disabled={fdevTokenLoading}
                        class="px-6 py-4 bg-anti-accent text-white font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all text-xs font-cinzel tracking-wider shadow-[0_0_15px_rgba(230,0,0,0.3)]"
                    >
                        {fdevTokenLoading ? 'GUARDANDO...' : '💾 GUARDAR'}
                    </button>
                </div>
                {#if fdevTokenError}
                    <div class="text-[10px] text-red-500 font-bold uppercase ml-4">{fdevTokenError}</div>
                {/if}
            </div>

            {#if fdevTokenLoaded}
                <!-- Action Tools -->
                <div class="flex flex-wrap gap-2 mb-6" transition:slide>
                    <button 
                        on:click={() => copyText(fdevTokenAddress, 'address')} 
                        class="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/70 uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        {copiedText === 'address' ? 'COPIADO!' : 'Copiar'}
                    </button>

                    <button 
                        on:click={() => watchAsset(fdevTokenAddress, fdevTokenInfo.symbol, fdevTokenInfo.decimals)} 
                        class="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/70 uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Agregar
                    </button>

                    <a 
                        href="{getExplorerBase(chainId)}{fdevTokenAddress}" 
                        target="_blank" 
                        class="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/70 uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Navegar
                    </a>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-2 gap-4 mb-6" transition:slide>
                    <div class="bg-black/40 border border-anti-border rounded-2xl p-4">
                        <span class="block text-[8px] font-black text-white/40 uppercase tracking-wider mb-1">Nombre</span>
                        <span class="text-sm font-bold text-white">{fdevTokenInfo.name}</span>
                    </div>
                    <div class="bg-black/40 border border-anti-border rounded-2xl p-4">
                        <span class="block text-[8px] font-black text-white/40 uppercase tracking-wider mb-1">Símbolo</span>
                        <span class="text-sm font-bold text-anti-accent">{fdevTokenInfo.symbol}</span>
                    </div>
                    <div class="bg-black/40 border border-anti-border rounded-2xl p-4">
                        <span class="block text-[8px] font-black text-white/40 uppercase tracking-wider mb-1">Decimales</span>
                        <span class="text-sm font-mono font-bold text-white">{fdevTokenInfo.decimals}</span>
                    </div>
                    <div class="bg-black/40 border border-anti-border rounded-2xl p-4">
                        <span class="block text-[8px] font-black text-white/40 uppercase tracking-wider mb-1">Total Supply</span>
                        <span class="text-sm font-mono font-bold text-white truncate" title={fdevTokenInfo.totalSupply}>{parseFloat(fdevTokenInfo.totalSupply).toLocaleString()}</span>
                    </div>
                </div>

                <!-- Balance Display -->
                <div class="bg-black border border-anti-border rounded-3xl p-6 flex flex-col gap-1 mb-8" transition:slide>
                    <span class="text-[9px] font-black text-white/40 uppercase tracking-wider">Tu Balance</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-cinzel font-black text-white">{parseFloat(fdevTokenInfo.balance).toFixed(4)}</span>
                        <span class="text-sm font-black text-anti-accent tracking-wider">{fdevTokenInfo.symbol}</span>
                    </div>
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center py-20 border border-dashed border-anti-border rounded-3xl opacity-30">
                    <svg class="w-12 h-12 mb-4 text-anti-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p class="font-cinzel text-xs uppercase tracking-widest text-center">Introduce el contrato para interactuar</p>
                </div>
            {/if}
        </section>

    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-8">
        
        <!-- CARD 2: Admin FERNANDODEV -->
        <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl group">
            <div class="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>

            <!-- Header -->
            <div class="flex items-center gap-5 mb-8">
                <div class="w-14 h-14 bg-anti-accent/10 rounded-2xl flex items-center justify-center border border-anti-accent/20 text-anti-accent shadow-[0_0_15px_rgba(230,0,0,0.15)]">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-white font-cinzel text-xl font-black tracking-tight">Admin FERNANDODEV</h3>
                    <p class="text-[10px] text-anti-accent font-black uppercase tracking-wider">Funciones de administrador (mint/burn)</p>
                </div>
            </div>

            {#if fdevTokenLoaded}
                <div class="space-y-6" transition:slide>
                    
                    <!-- Ownership Verification Banner/Controls -->
                    {#if !isAdminVerified}
                        <div class="p-6 bg-black/40 border border-anti-border rounded-3xl flex flex-col gap-4">
                            <span class="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] font-mono">Verificación de Propietario (Owner)</span>
                            <p class="text-xs text-white/40 leading-relaxed">
                                Para acceder a las funciones de Mint y Burn, es necesario verificar que la dirección de tu billetera actual corresponda al Owner del contrato.
                            </p>
                            {#if ownerVerificationError}
                                <div class="text-[10px] text-red-500 font-bold uppercase font-mono">{ownerVerificationError}</div>
                            {/if}
                            <button 
                                on:click={verifyOwnership}
                                disabled={ownerVerificationLoading}
                                class="w-full py-3 bg-anti-accent text-white font-black font-cinzel text-xs rounded-xl hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(230,0,0,0.3)]"
                            >
                                {ownerVerificationLoading ? 'VERIFICANDO...' : 'VERIFICAR SI SOY OWNER'}
                            </button>
                        </div>
                    {:else}
                        <!-- Propietario Verificado Status -->
                        <div class="px-5 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between">
                            <span class="text-[10px] font-black text-green-500 uppercase tracking-widest font-mono">Propietario Verificado ✅</span>
                            <button 
                                on:click={() => { isAdminVerified = false; isOwner = false; }} 
                                class="text-[9px] text-white/30 hover:text-white uppercase tracking-widest hover:underline"
                            >
                                Bloquear
                            </button>
                        </div>

                        <!-- Mint Section -->
                        <div class="space-y-4 bg-black/40 border border-anti-border rounded-3xl p-6" transition:slide>
                            <span class="block text-[10px] font-black text-anti-accent uppercase tracking-[0.2em] mb-2 font-mono">Emitir Tokens (Mint)</span>
                            
                            <div class="space-y-3">
                                <input 
                                    type="text" 
                                    bind:value={mintToAddress} 
                                    placeholder="0x... (Dirección de destino)" 
                                    class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white focus:border-anti-accent outline-none transition-all font-mono text-sm" 
                                />
                                <input 
                                    type="number" 
                                    bind:value={mintAmount} 
                                    placeholder="Monto a emitir" 
                                    class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white focus:border-anti-accent outline-none transition-all font-mono text-sm" 
                                />
                            </div>

                            {#if mintError}
                                <div class="p-4 bg-red-900/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase">{mintError}</div>
                            {/if}

                            {#if mintTxHash}
                                <div class="p-4 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between text-xs">
                                    <div class="truncate mr-4">
                                        <span class="block text-[10px] font-black text-green-500 uppercase">Mint Exitoso</span>
                                        <span class="text-[9px] text-white/40 font-mono">{mintTxHash}</span>
                                    </div>
                                    <a href="{getExplorerBase(chainId)}{mintTxHash}" target="_blank" class="px-4 py-2 bg-green-500 text-black font-black rounded-xl text-[9px] uppercase tracking-wider shrink-0">Ver Tx</a>
                                </div>
                            {/if}

                            <button 
                                on:click={runMint} 
                                disabled={mintLoading || !mintToAddress || !mintAmount}
                                class="w-full py-4 bg-white text-black font-black font-cinzel text-xs rounded-2xl hover:bg-anti-accent hover:text-white transition-all disabled:opacity-20 shadow-lg"
                            >
                                {mintLoading ? 'EMITIENDO...' : 'EMITIR'}
                            </button>
                        </div>

                        <!-- Burn Section -->
                        <div class="space-y-4 bg-black/40 border border-anti-border rounded-3xl p-6" transition:slide>
                            <span class="block text-[10px] font-black text-anti-accent uppercase tracking-[0.2em] mb-2 font-mono">Quemar Tokens (Burn)</span>
                            
                            <div class="space-y-3">
                                <input 
                                    type="number" 
                                    bind:value={burnAmount} 
                                    placeholder="Monto a quemar" 
                                    class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white focus:border-anti-accent outline-none transition-all font-mono text-sm" 
                                />
                            </div>

                            {#if burnError}
                                <div class="p-4 bg-red-900/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase">{burnError}</div>
                            {/if}

                            {#if burnTxHash}
                                <div class="p-4 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between text-xs">
                                    <div class="truncate mr-4">
                                        <span class="block text-[10px] font-black text-green-500 uppercase">Quema Exitosa</span>
                                        <span class="text-[9px] text-white/40 font-mono">{burnTxHash}</span>
                                    </div>
                                    <a href="{getExplorerBase(chainId)}{burnTxHash}" target="_blank" class="px-4 py-2 bg-green-500 text-black font-black rounded-xl text-[9px] uppercase tracking-wider shrink-0">Ver Tx</a>
                                </div>
                            {/if}

                            <button 
                                on:click={runBurn} 
                                disabled={burnLoading || !burnAmount}
                                class="w-full py-4 bg-white text-black font-black font-cinzel text-xs rounded-2xl hover:bg-anti-accent hover:text-white transition-all disabled:opacity-20 shadow-lg"
                            >
                                {burnLoading ? 'QUEMANDO...' : 'QUEMAR'}
                            </button>
                        </div>
                    {/if}

                </div>
            {:else}
                <div class="flex flex-col items-center justify-center p-10 bg-black/40 border border-dashed border-anti-border rounded-3xl text-center">
                    <svg class="w-12 h-12 mb-4 text-anti-accent/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p class="text-[11px] font-bold text-white/50 uppercase tracking-wider leading-relaxed">
                        Configura la dirección del contrato FERNANDODEV primero en el panel principal
                    </p>
                </div>
            {/if}
        </section>

    </div>
</div>


