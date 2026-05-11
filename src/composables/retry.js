export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
	let lastError;
	
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;
			if (attempt < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, attempt);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
	
	throw lastError;
}

export async function fetchWithRetry(url, options, maxRetries = 3) {
	return retryWithBackoff(
		() => fetch(url, options),
		maxRetries,
		1000
	);
}