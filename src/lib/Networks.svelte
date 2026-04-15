<script>
    export let chainId = '';

    let error = '';

    const networks = [
        {
            id: '570',
            name: 'Rollux Mainnet',
            type: 'EVM / L2',
            chainHex: '0x23a',
            rpc: 'https://rpc.rollux.com',
            ticker: 'SYS',
            explorer: 'https://explorer.rollux.com',
            icon: '🔵'
        },
        {
            id: '57000',
            name: 'Rollux Testnet',
            type: 'EVM / L2 Test',
            chainHex: '0xdea8',
            rpc: 'https://rpc-tanenbaum.rollux.com',
            ticker: 'tSYS',
            explorer: 'https://rollux.tanenbaum.io',
            icon: '🧪'
        },
        {
            id: '57',
            name: 'Syscoin NEVM',
            type: 'UTXO / EVM',
            chainHex: '0x39',
            rpc: 'https://rpc.syscoin.org',
            ticker: 'SYS',
            explorer: 'https://explorer.syscoin.org',
            icon: '🟦'
        },
        {
            id: '5700',
            name: 'Syscoin Tanenbaum',
            type: 'UTXO / EVM Test',
            chainHex: '0x1644',
            rpc: 'https://rpc.tanenbaum.io',
            ticker: 'tSYS',
            explorer: 'https://tanenbaum.io',
            icon: '🔬'
        },
        {
            id: '1',
            name: 'Ethereum Mainnet',
            type: 'EVM',
            chainHex: '0x1',
            rpc: 'https://eth.llamarpc.com',
            ticker: 'ETH',
            explorer: 'https://etherscan.io',
            icon: '⟠'
        },
        {
            id: '11155111',
            name: 'Sepolia Testnet',
            type: 'EVM Test',
            chainHex: '0xaa36a7',
            rpc: 'https://rpc.sepolia.org',
            ticker: 'ETH',
            explorer: 'https://sepolia.etherscan.io',
            icon: '♦️'
        },
        {
            id: '137',
            name: 'Polygon PoS',
            type: 'EVM / L2',
            chainHex: '0x89',
            rpc: 'https://polygon-rpc.com',
            ticker: 'MATIC',
            explorer: 'https://polygonscan.com',
            icon: '🟣'
        },
        {
            id: '56',
            name: 'BNB Smart Chain',
            type: 'EVM',
            chainHex: '0x38',
            rpc: 'https://bsc-dataseed.binance.org',
            ticker: 'BNB',
            explorer: 'https://bscscan.com',
            icon: '🟡'
        },
        {
            id: '43114',
            name: 'Avalanche C-Chain',
            type: 'EVM',
            chainHex: '0xa86a',
            rpc: 'https://api.avax.network/ext/bc/C/rpc',
            ticker: 'AVAX',
            explorer: 'https://snowtrace.io',
            icon: '🔺'
        }
    ];

    async function switchNetwork(net) {
        error = '';
        const ethereum = window['ethereum'];
        if (!ethereum) {
            error = 'Extensión Wallet no detectada.';
            return;
        }

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: net.chainHex }],
            });
        } catch (switchError) {
            // Este código de error indica que la cadena no se ha añadido a MetaMask/Pali.
            if (switchError.code === 4902 || switchError.code === -32603) {
                try {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: net.chainHex,
                                chainName: net.name,
                                rpcUrls: [net.rpc],
                                nativeCurrency: {
                                    name: net.ticker,
                                    symbol: net.ticker,
                                    decimals: 18
                                },
                                blockExplorerUrls: [net.explorer]
                            },
                        ],
                    });
                } catch (addError) {
                    error = addError.message;
                }
            } else {
                error = switchError.message;
            }
        }
    }
</script>

<div class="networks-pane appear">
    <div class="header-sec">
        <h3>Gestor de Redes (Cross-Chain)</h3>
        <p>Cambia fácilmente entre redes UTXO y EVM compatibles. Si la red no existe en tu wallet, se añadirá automáticamente.</p>
        <div class="current-net">
            <span class="current-dot"></span>
            Red activa: <strong>{chainId ? `Chain ID ${chainId}` : 'No conectada'}</strong>
        </div>
    </div>

    {#if error}
        <div class="error-box">{error}</div>
    {/if}

    <div class="section-label">🔷 Ecosistema Syscoin</div>
    <div class="networks-grid">
        {#each networks.filter(n => ['570','57000','57','5700'].includes(n.id)) as net, i}
            <div class="network-card {chainId === net.id ? 'card-active' : ''} appear" style="animation-delay: {i * 80}ms">
                <div class="net-top">
                    <span class="net-icon">{net.icon}</span>
                    <span class="net-type">{net.type}</span>
                </div>
                <h4>{net.name}</h4>
                <p class="net-details">Chain ID: {net.id} | {net.ticker}</p>
                
                {#if chainId === net.id}
                    <div class="status active">
                        <span class="dot"></span> Red Activa
                    </div>
                {:else}
                    <button class="btn-switch" on:click={() => switchNetwork(net)}>
                        Conectar a {net.ticker}
                    </button>
                {/if}
            </div>
        {/each}
    </div>

    <div class="section-label">🌐 Otras Redes EVM</div>
    <div class="networks-grid">
        {#each networks.filter(n => !['570','57000','57','5700'].includes(n.id)) as net, i}
            <div class="network-card {chainId === net.id ? 'card-active' : ''} appear" style="animation-delay: {(i + 4) * 80}ms">
                <div class="net-top">
                    <span class="net-icon">{net.icon}</span>
                    <span class="net-type">{net.type}</span>
                </div>
                <h4>{net.name}</h4>
                <p class="net-details">Chain ID: {net.id} | {net.ticker}</p>
                
                {#if chainId === net.id}
                    <div class="status active">
                        <span class="dot"></span> Red Activa
                    </div>
                {:else}
                    <button class="btn-switch" on:click={() => switchNetwork(net)}>
                        Conectar a {net.ticker}
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .networks-pane { text-align: left; }

    .header-sec { margin-bottom: 2rem; }
    .header-sec h3 {
        margin: 0 0 0.2rem;
        font-size: 1.25rem;
        color: var(--platinum);
    }
    .header-sec p { margin: 0 0 1rem; font-size: 0.85rem; color: var(--muted); }

    .current-net {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: rgba(0, 208, 142, 0.06);
        border: 1px solid rgba(0, 208, 142, 0.15);
        padding: 0.6rem 1.2rem;
        border-radius: 12px;
        font-size: 0.85rem;
        color: var(--muted);
    }

    .current-net strong {
        color: var(--accent, #00ffa3);
    }

    .current-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--accent, #00ffa3);
        box-shadow: 0 0 8px var(--accent, #00ffa3);
        animation: pulse 2s infinite;
    }

    .section-label {
        font-size: 0.8rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        margin: 1.5rem 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .networks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
    }

    .network-card {
        background: rgba(240, 242, 246, 0.03);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
    }

    .network-card:hover {
        background: rgba(240, 242, 246, 0.06);
        border-color: var(--border-2);
        transform: translateY(-2px);
    }

    .network-card.card-active {
        border-color: rgba(0, 208, 142, 0.3);
        background: rgba(0, 208, 142, 0.04);
        box-shadow: 0 0 20px rgba(0, 208, 142, 0.06);
    }

    .net-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .net-icon { font-size: 1.5rem; }

    .net-type {
        font-size: 0.65rem;
        background: rgba(240, 242, 246, 0.1);
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .network-card h4 {
        margin: 0 0 0.3rem;
        font-size: 1.05rem;
        color: var(--platinum);
    }

    .net-details {
        margin: 0 0 1.5rem;
        font-size: 0.8rem;
        color: rgba(139, 148, 158, 0.7);
        font-family: monospace;
    }

    .status.active {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--accent, #00d08e);
        background: rgba(0, 208, 142, 0.1);
        border: 1px solid rgba(0, 208, 142, 0.2);
        padding: 0.6rem;
        border-radius: 10px;
        justify-content: center;
        font-weight: 600;
        margin-top: auto;
    }

    .dot {
        width: 8px; height: 8px;
        background: var(--accent, #00ffa3);
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    .btn-switch {
        margin-top: auto;
        background: rgba(240, 242, 246, 0.08);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 0.6rem;
        border-radius: 10px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.2s;
        font-weight: 500;
    }

    .btn-switch:hover {
        background: rgba(240, 242, 246, 0.15);
    }

    .error-box {
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
        color: var(--bad, #ff5555);
        padding: 0.8rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        font-size: 0.85rem;
    }

    .appear { animation: fadeUp 400ms ease-out both; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to {opacity:1; transform:translateY(0);} }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
