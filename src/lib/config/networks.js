// @ts-nocheck
export const UTXO_NETWORKS = [
    {
        id: 'bitcoin',
        name: 'Bitcoin',
        category: 'UTXO Networks',
        symbol: 'BTC',
        note: 'Conecta la cuenta UTXO activa desde Pali Wallet.',
        iconText: 'B',
        networkKey: 'bitcoin',
        expectedLabels: ['bitcoin', 'btc']
    },
    {
        id: 'syscoin-mainnet-utxo',
        name: 'Syscoin Mainnet',
        category: 'UTXO Networks',
        symbol: 'SYS',
        note: 'Cuenta UTXO nativa de Syscoin dentro de Pali Wallet.',
        iconText: 'S',
        networkKey: 'syscoin-mainnet',
        isTestnet: false,
        expectedLabels: ['syscoin', 'mainnet', 'sys']
    },
    {
        id: 'syscoin-testnet-utxo',
        name: 'Syscoin Testnet',
        category: 'UTXO Networks',
        symbol: 'tSYS',
        note: 'Cuenta UTXO de pruebas dentro de Pali Wallet.',
        iconText: 'S',
        networkKey: 'syscoin-testnet',
        isTestnet: true,
        expectedLabels: ['syscoin', 'testnet', 'tanenbaum', 'tsys']
    }
];

export const EVM_NETWORKS = [
    {
        id: '570',
        name: 'Rollux',
        category: 'EVM Networks',
        chainHex: '0x23a',
        rpc: 'https://rpc.rollux.com',
        ticker: 'SYS',
        explorer: 'https://explorer.rollux.com',
        nativeCurrencyName: 'Syscoin',
        iconText: 'R',
        tone: 'lime',
        apiUrl: 'https://explorer.rollux.com/api'
    },
    {
        id: '57',
        name: 'Syscoin NEVM',
        category: 'EVM Networks',
        chainHex: '0x39',
        rpc: 'https://rpc.syscoin.org',
        ticker: 'SYS',
        explorer: 'https://explorer.syscoin.org',
        nativeCurrencyName: 'Syscoin',
        iconText: 'S',
        tone: 'cyan',
        apiUrl: 'https://explorer.syscoin.org/api'
    },
    {
        id: '1',
        name: 'Ethereum Mainnet',
        category: 'EVM Networks',
        chainHex: '0x1',
        rpc: 'https://eth.llamarpc.com',
        ticker: 'ETH',
        explorer: 'https://etherscan.io',
        nativeCurrencyName: 'Ether',
        iconText: 'E',
        tone: 'indigo',
        apiUrl: 'https://api.etherscan.io/api'
    },
    {
        id: '137',
        name: 'Polygon Mainnet',
        category: 'EVM Networks',
        chainHex: '0x89',
        rpc: 'https://polygon-rpc.com',
        ticker: 'POL',
        explorer: 'https://polygonscan.com',
        nativeCurrencyName: 'Polygon',
        iconText: 'P',
        tone: 'violet',
        apiUrl: 'https://api.polygonscan.com/api'
    },
    {
        id: '5700',
        name: 'Syscoin NEVM Testnet',
        category: 'EVM Networks',
        chainHex: '0x1644',
        rpc: 'https://rpc.tanenbaum.io',
        ticker: 'tSYS',
        explorer: 'https://tanenbaum.io',
        nativeCurrencyName: 'Test Syscoin',
        iconText: 'S',
        tone: 'sky',
        apiUrl: 'https://tanenbaum.io/api'
    },
    {
        id: '57057',
        name: 'zk.tanenbaum.io',
        category: 'EVM Networks',
        chainHex: '0xdee1',
        rpc: 'https://rpc-zk.tanenbaum.io/',
        ticker: 'TSYS',
        explorer: 'https://explorer-zk.tanenbaum.io',
        nativeCurrencyName: 'TSYS',
        iconText: 'ZK',
        tone: 'pink',
        apiUrl: 'https://explorer-zk.tanenbaum.io/api',
        faucets: [
            'https://faucet.syscoin.org',
            'https://faucet-zk.tanenbaum.io'
        ]
    },
    {
        id: '57000',
        name: 'Rollux Testnet',
        category: 'EVM Networks',
        chainHex: '0xdea8',
        rpc: 'https://rpc-testnet.rollux.com',
        ticker: 'tSYS',
        explorer: 'https://rollux.tanenbaum.io',
        nativeCurrencyName: 'Test Syscoin',
        iconText: 'RT',
        tone: 'blue',
        apiUrl: 'https://rollux.tanenbaum.io/api'
    },
    {
        id: '11155111',
        name: 'Sepolia',
        category: 'EVM Networks',
        chainHex: '0xaa36a7',
        rpc: 'https://ethereum-sepolia-rpc.publicnode.com/',
        ticker: 'ETH',
        explorer: 'https://sepolia.etherscan.io',
        nativeCurrencyName: 'ETH',
        iconText: 'SE',
        tone: 'indigo',
        apiUrl: 'https://api.etherscan.io/v2/api',
        apiChainId: '11155111',
        faucets: [
            'https://cloud.google.com/application/web3/faucet/ethereum/sepolia'
        ]
    },
    {
        id: '56',
        name: 'BNB Chain',
        category: 'EVM Networks',
        chainHex: '0x38',
        rpc: 'https://bsc-dataseed.binance.org',
        ticker: 'BNB',
        explorer: 'https://bscscan.com',
        nativeCurrencyName: 'BNB',
        iconText: 'B',
        tone: 'amber'
    },
    {
        id: '43114',
        name: 'Avalanche',
        category: 'EVM Networks',
        chainHex: '0xa86a',
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        ticker: 'AVAX',
        explorer: 'https://snowtrace.io',
        nativeCurrencyName: 'Avalanche',
        iconText: 'A',
        tone: 'pink'
    },
    {
        id: '42161',
        name: 'Arbitrum One',
        category: 'EVM Networks',
        chainHex: '0xa4b1',
        rpc: 'https://arb1.arbitrum.io/rpc',
        ticker: 'ETH',
        explorer: 'https://arbiscan.io',
        nativeCurrencyName: 'Ether',
        iconText: 'AR',
        tone: 'blue'
    },
    {
        id: '421613',
        name: 'Arbitrum Testnet',
        category: 'EVM Networks',
        chainHex: '0x66eed',
        rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
        ticker: 'ETH',
        explorer: 'https://sepolia.arbiscan.io',
        nativeCurrencyName: 'Sepolia Ether',
        iconText: 'AT',
        tone: 'sky'
    },
    {
        id: '80001',
        name: 'Polygon Testnet',
        category: 'EVM Networks',
        chainHex: '0x13881',
        rpc: 'https://rpc-mumbai.maticvigil.com',
        ticker: 'MATIC',
        explorer: 'https://mumbai.polygonscan.com',
        nativeCurrencyName: 'MATIC',
        iconText: 'PT',
        tone: 'violet'
    },
    {
        id: '59140',
        name: 'Linea Testnet',
        category: 'EVM Networks',
        chainHex: '0xe704',
        rpc: 'https://rpc.sepolia.linea.build',
        ticker: 'ETH',
        explorer: 'https://sepolia.lineascan.build',
        nativeCurrencyName: 'Sepolia Ether',
        iconText: 'L',
        tone: 'cyan'
    },
    {
        id: '11155420',
        name: 'Optimism Testnet',
        category: 'EVM Networks',
        chainHex: '0xaa37dc',
        rpc: 'https://sepolia.optimism.io',
        ticker: 'ETH',
        explorer: 'https://sepolia-optimism.etherscan.io',
        nativeCurrencyName: 'Sepolia Ether',
        iconText: 'OP',
        tone: 'pink'
    },
    {
        id: '560048',
        name: 'Ethereum Hoodi',
        category: 'EVM Networks',
        chainHex: '0x88bb0',
        rpc: 'https://0xrpc.io/hoodi',
        ticker: 'ETH',
        explorer: 'https://hoodi.etherscan.io/',
        nativeCurrencyName: 'ETH',
        iconText: 'H',
        tone: 'orange',
        apiUrl: 'https://api.etherscan.io/v2/api',
        apiChainId: '560048',
        faucets: [
            'https://cloud.google.com/application/web3/faucet/ethereum/hoodi'
        ]
    }
];

export const SUPPORTED_EVM_CHAIN_IDS = EVM_NETWORKS.map((network) => network.id);

/** @param {string|number} id */
export function getEvmNetwork(id) {
    return EVM_NETWORKS.find((network) => network.id === String(id));
}


/** @param {string|number} id */
/** @param {string} address */
export function getNetworkName(id, address = '') {
    if (id === 'utxo') {
        if (!address) return 'Pali UTXO';
        const addr = address.toLowerCase();
        if (addr.startsWith('sys') || addr.startsWith('tsys')) {
            return addr.startsWith('tsys') ? 'Syscoin Testnet' : 'Syscoin Mainnet';
        }
        if (addr.startsWith('bc1') || /^[13]/.test(address)) return 'Bitcoin';
        return 'UTXO Network';
    }
    return getEvmNetwork(id)?.name || `Chain ID ${id}`;
}

/** @param {string|number} id */
/** @param {string} address */
export function getNetworkTicker(id, address = '') {
    if (id === 'utxo') {
        if (!address) return 'SYS';
        const addr = address.toLowerCase();
        if (addr.startsWith('sys') || addr.startsWith('tsys')) return addr.startsWith('tsys') ? 'tSYS' : 'SYS';
        if (addr.startsWith('bc1') || /^[13]/.test(address)) return 'BTC';
        return 'SYS';
    }
    return getEvmNetwork(id)?.ticker || 'ETH';
}

/** @param {string|number} id */
export function getExplorerBase(id) {
    const explorer = getEvmNetwork(id)?.explorer || 'https://explorer.syscoin.org';
    return `${explorer.replace(/\/$/, '')}/tx/`;
}

/** @param {string|number} id */
export function getExplorerApiUrl(id) {
    const network = getEvmNetwork(id);
    if (!network) return '';
    // Use specific apiUrl if defined (e.g., Etherscan)
    if (network.apiUrl) {
        if (network.apiChainId) return `${network.apiUrl}?chainid=${network.apiChainId}`;
        return network.apiUrl;
    }
    // Default to Blockscout style /api
    return network.explorer ? `${network.explorer.replace(/\/$/, '')}/api` : '';
}

/** @param {any} network */
export function buildAddChainParams(network) {
    return {
        chainId: network.chainHex,
        chainName: network.name,
        rpcUrls: [network.rpc],
        nativeCurrency: {
            name: network.nativeCurrencyName || network.ticker,
            symbol: network.ticker,
            decimals: 18
        },
        blockExplorerUrls: network.explorer ? [network.explorer] : undefined
    };
}
