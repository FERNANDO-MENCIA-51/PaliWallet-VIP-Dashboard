import { writable, derived } from 'svelte/store';
import { ethers } from 'ethers';
import { getNetworkName, getNetworkTicker } from '../lib/config/networks.js';

/**
 * @typedef {Object} WalletState
 * @property {string} address
 * @property {string} balance
 * @property {string} chainId
 * @property {boolean} connected
 * @property {boolean} loading
 * @property {string} error
 * @property {string} tokenBalance
 * @property {string} tokenSymbol
 */

const initialState = {
	address: '',
	balance: '',
	chainId: '',
	connected: false,
	loading: false,
	error: '',
	tokenBalance: '',
	tokenSymbol: 'TSYS'
};

function createWalletStore() {
	/** @type {import('svelte/store').Writable<WalletState>} */
	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,
		/** @param {string} address */
		setAddress: (address) => update(s => ({ ...s, address })),
		/** @param {string} balance */
		setBalance: (balance) => update(s => ({ ...s, balance })),
		/** @param {string} chainId */
		setChainId: (chainId) => update(s => ({ ...s, chainId })),
		/** @param {boolean} connected */
		setConnected: (connected) => update(s => ({ ...s, connected })),
		/** @param {boolean} loading */
		setLoading: (loading) => update(s => ({ ...s, loading })),
		/** @param {string} error */
		setError: (error) => update(s => ({ ...s, error })),
		/** @param {string} tokenBalance */
		setTokenBalance: (tokenBalance) => update(s => ({ ...s, tokenBalance })),
		/** @param {string} tokenSymbol */
		setTokenSymbol: (tokenSymbol) => update(s => ({ ...s, tokenSymbol })),
		reset: () => set(initialState),
		connect: async function() {
			update(s => ({ ...s, error: '', loading: true }));
			
			try {
				const ethereum = /** @type {any} */(window).ethereum;
				if (!ethereum) {
					update(s => ({ ...s, error: 'Pali Wallet no detectada. Instala la extensión desde https://palitech.io', loading: false }));
					return;
				}

				await ethereum.request({ 
					method: 'wallet_requestPermissions', 
					params: [{ eth_accounts: {} }] 
				});

				const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
				if (!accounts || accounts.length === 0) throw new Error('No se seleccionó ninguna cuenta.');

				const provider = new ethers.BrowserProvider(ethereum);
				const signer = await provider.getSigner();
				const address = await signer.getAddress();
				const rawBalance = await provider.getBalance(address);
				const network = await provider.getNetwork();

				update(s => ({
					...s,
					address,
					balance: ethers.formatEther(rawBalance),
					chainId: network.chainId.toString(),
					connected: true,
					loading: false
				}));

				sessionStorage.setItem('pali_connected', 'true');
			} catch (err) {
				update(s => ({ ...s, error: (err instanceof Error ? err.message : String(err)) || 'Error al conectar la wallet', loading: false }));
			}
		}
	};
}

export const wallet = createWalletStore();

export const shortAddress = derived(wallet, $wallet => 
	$wallet.address ? $wallet.address.slice(0, 6) + '...' + $wallet.address.slice(-4) : ''
);

export const activeNetworkName = derived(wallet, $wallet => 
	$wallet.chainId ? getNetworkName($wallet.chainId) : 'No conectada'
);

export const nativeTicker = derived(wallet, $wallet => 
	getNetworkTicker($wallet.chainId)
);