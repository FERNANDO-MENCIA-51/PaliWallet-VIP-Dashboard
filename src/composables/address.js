import { ethers } from 'ethers';

export function isValidEthereumAddress(address) {
	if (!address || typeof address !== 'string') return false;
	return ethers.isAddress(address);
}

export function isValidChecksumAddress(address) {
	if (!address || typeof address !== 'string') {
		return { valid: false };
	}

	if (!ethers.isAddress(address)) {
		return { valid: false };
	}

	try {
		const checksumAddress = ethers.getAddress(address);
		const isValid = address.toLowerCase() === checksumAddress.toLowerCase() || 
			address === checksumAddress;
		return { valid: true, suggestion: isValid ? address : checksumAddress };
	} catch {
		return { valid: true };
	}
}

export function formatAddress(address, prefixLen = 6, suffixLen = 4) {
	if (!address || address.length < prefixLen + suffixLen) return address || '';
	return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

export function copyToClipboard(text) {
	if (!navigator?.clipboard) {
		return Promise.resolve(false);
	}
	return navigator.clipboard.writeText(text)
		.then(() => true)
		.catch(() => false);
}

export function parseTransactionError(error) {
	if (error && typeof error === 'object' && 'code' in error) {
		if (error.code === 4001) return 'Transacción rechazada por el usuario';
		if (error.code === -32000) return 'Fondos insuficientes para gas';
		return error.reason || error.message || 'Error desconocido';
	}
	if (error instanceof Error) {
		return error.message;
	}
	return 'Error inesperado';
}