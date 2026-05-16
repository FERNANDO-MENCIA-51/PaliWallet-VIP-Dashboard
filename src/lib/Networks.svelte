<script>
    import { fade, slide } from 'svelte/transition';

    export let currentChainId = '';
    /** @param {any} net */
    export let onSwitch = (net) => {};
    /** @param {any} net */
    export let onSwitchUtxo = (net) => {};
    /** @type {string[]} */
    export let hiddenNetworks = [];
    /** @param {string} id */
    export let onToggleHide = (id) => {};
    
    /** @type {any[]} */
    export let evmNetworks = [];
    /** @type {any[]} */
    export let utxoNetworks = [];

    let filter = 'visibles'; // 'visibles' | 'ocultas' | 'todas'

    $: filteredEvm = evmNetworks.filter(net => {
        const isHidden = hiddenNetworks.includes(net.id);
        if (filter === 'visibles') return !isHidden;
        if (filter === 'ocultas') return isHidden;
        return true;
    });

</script>

<div class="flex flex-col gap-10" in:fade>
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="flex flex-col gap-4">
            <h2 class="font-cinzel text-4xl font-black text-white uppercase tracking-tight">Gestión de Redes</h2>
            <p class="text-gray-500 max-w-xl">Personaliza tu terminal activando o desactivando protocolos. Las redes ocultas no aparecerán en el selector rápido.</p>
        </div>

        <!-- Filter Controls -->
        <div class="flex bg-black/40 border border-anti-border p-1 rounded-2xl">
            <button on:click={() => filter = 'visibles'} class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {filter === 'visibles' ? 'bg-anti-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}">Visibles</button>
            <button on:click={() => filter = 'ocultas'} class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {filter === 'ocultas' ? 'bg-anti-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}">Ocultas ({hiddenNetworks.length})</button>
            <button on:click={() => filter = 'todas'} class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all {filter === 'todas' ? 'bg-anti-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}">Todas</button>
        </div>
    </header>

    <!-- EVM Section -->
    <section class="space-y-8">
        <div class="flex items-center gap-4">
            <div class="h-px flex-1 bg-anti-border"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.5em] text-anti-accent">Protocolos EVM</span>
            <div class="h-px flex-1 bg-anti-border"></div>
        </div>

        {#if filteredEvm.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" transition:fade>
                {#each filteredEvm as net (net.id)}
                    {@const isHidden = hiddenNetworks.includes(net.id)}
                    {@const isActive = currentChainId === net.id}
                    
                    <div class="bg-anti-surface border {isActive ? 'border-anti-accent shadow-[0_0_30px_rgba(230,0,0,0.15)]' : 'border-anti-border'} rounded-3xl p-8 flex flex-col gap-6 relative group transition-all hover:border-anti-accent/50 {isHidden ? 'opacity-60' : ''}">
                        {#if isActive}
                            <div class="absolute top-6 right-6">
                                <div class="flex items-center gap-2 px-3 py-1 bg-anti-accent/10 border border-anti-accent/20 rounded-full">
                                    <div class="w-1.5 h-1.5 rounded-full bg-anti-accent animate-pulse"></div>
                                    <span class="text-[9px] font-black text-anti-accent uppercase">Activo</span>
                                </div>
                            </div>
                        {/if}

                        <div class="flex items-center gap-5">
                            <div class="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-anti-border font-cinzel text-xl font-black text-anti-accent group-hover:bg-anti-accent group-hover:text-white transition-all duration-500">
                                {net.iconText || net.name[0]}
                            </div>
                            <div>
                                <h3 class="text-white font-bold">{net.name}</h3>
                                <p class="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">Chain ID: {net.id}</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span class="text-gray-600">Moneda:</span>
                                <span class="text-anti-silver">{net.ticker}</span>
                            </div>
                            <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span class="text-gray-600">Estado:</span>
                                <span class={isHidden ? 'text-red-500' : 'text-green-500'}>{isHidden ? 'DESACTIVADO' : 'VISIBLE'}</span>
                            </div>
                        </div>

                        <div class="flex gap-2 mt-2">
                            <button on:click={() => onSwitch(net)} class="flex-1 py-3 bg-white text-black font-black font-cinzel text-xs rounded-xl hover:bg-anti-accent hover:text-white transition-all">{isHidden ? 'ACTIVAR Y CAMBIAR' : 'CAMBIAR'}</button>
                            <button on:click={() => onToggleHide(net.id)} class="px-4 py-3 border border-anti-border rounded-xl transition-all {isHidden ? 'bg-green-500/10 hover:border-green-500/50' : 'hover:bg-red-900/10 hover:border-red-500/50'}" title={isHidden ? 'Restaurar Red' : 'Desactivar Red'}>
                                <svg class="w-5 h-5 {isHidden ? 'text-green-500' : 'text-red-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isHidden ? "M12 4v16m8-8H4" : "M6 18L18 6M6 6l12 12"}/></svg>
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center py-20 border border-dashed border-anti-border rounded-3xl opacity-30">
                <p class="font-cinzel text-sm uppercase tracking-widest">No hay redes en esta categoría</p>
            </div>
        {/if}
    </section>

    <!-- UTXO Section -->
    <section class="space-y-8 mt-10">
        <div class="flex items-center gap-4">
            <div class="h-px flex-1 bg-anti-border"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">Protocolos UTXO (Nativos)</span>
            <div class="h-px flex-1 bg-anti-border"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each utxoNetworks as net}
                <div class="bg-black/40 border border-anti-border rounded-3xl p-8 flex flex-col gap-6 group hover:border-anti-accent transition-all">
                    <div class="flex items-center gap-5">
                        <div class="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center border border-anti-border font-cinzel text-xl font-black text-gray-500 group-hover:text-anti-accent transition-colors">
                            {net.iconText || net.name[0]}
                        </div>
                        <div>
                            <h3 class="text-gray-400 font-bold group-hover:text-white transition-colors">{net.name}</h3>
                            <p class="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">Protocolo Nativo</p>
                        </div>
                    </div>
                    <p class="text-[11px] text-gray-700 italic leading-relaxed">{net.note}</p>
                    <button on:click={() => onSwitchUtxo(net)} class="w-full py-3 bg-white text-black font-black font-cinzel text-[10px] rounded-xl hover:bg-anti-accent hover:text-white transition-all uppercase tracking-widest">
                        CAMBIAR A {net.symbol}
                    </button>
                </div>
            {/each}
        </div>
    </section>

    <footer class="mt-10 p-6 bg-red-900/5 border border-red-900/20 rounded-2xl">
        <p class="text-[10px] text-gray-600 font-mono italic flex gap-3">
            <span class="text-red-500 font-bold">NOTA SEGURIDAD:</span>
            Para eliminar una red permanentemente de Pali Wallet, debes hacerlo manualmente desde la configuración de la extensión. El Terminal solo gestiona la visibilidad y conexión del DApp.
        </p>
    </footer>
</div>
