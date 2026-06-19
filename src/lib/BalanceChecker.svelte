<script>
  import { ethers } from "ethers";
  import { fade, slide } from "svelte/transition";
  import { EVM_NETWORKS } from "./config/networks.js";

  const FALLBACK_RPCS = {
    "57": ["https://rpc.syscoin.org", "https://syscoin-evm.publicnode.com"],
    "1": ["https://eth.llamarpc.com", "https://ethereum.publicnode.com"],
    "137": ["https://polygon-rpc.com", "https://polygon-bor.publicnode.com", "https://1rpc.io/matic"],
  };

  const DEPRECATED_NETWORKS = [];

  let addressInput = "";
  let checking = false;
  let results = [];
  let error = "";
  let selectedNetwork = "all"; // "all" para todas las redes, o chainId específico

  function isValidAddress(addr) {
    try { return ethers.isAddress(addr); } catch (e) { return false; }
  }

  function shortAddr(addr) {
    if (!addr || addr.length < 12) return addr;
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  async function rpcCall(url, method, params, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 80)}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "RPC error");
      return data.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async function tryFetchBalance(rpcList, address) {
    for (const url of rpcList) {
      try {
        const raw = await rpcCall(url, "eth_getBalance", [address, "latest"]);
        const balance = ethers.formatEther(raw);
        const block = await rpcCall(url, "eth_blockNumber", []).catch(() => "?");
        return { balance, block: parseInt(block, 16) || "?" };
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  function getErrorReason(netId, errMsg) {
    if (DEPRECATED_NETWORKS.includes(netId)) return "Red deprecada";
    if (!errMsg) return "Error de conexión";
    if (errMsg.includes("timeout") || errMsg.includes("aborted")) return "Timeout (8s)";
    if (errMsg.includes("fetch failed") || errMsg.includes("Failed to fetch") || errMsg.includes("NetworkError")) return "RPC no accesible";
    if (errMsg.includes("521") || errMsg.includes("502") || errMsg.includes("503")) return "Servidor RPC caído";
    if (errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("Unauthorized") || errMsg.includes("API key") || errMsg.includes("disabled")) return "API key inválida / requiere auth";
    if (errMsg.includes("CORS") || errMsg.includes("cross-origin")) return "Bloqueado por CORS";
    return errMsg.slice(0, 60);
  }

  function buildNetworkList() {
    return EVM_NETWORKS.filter((n) => {
      if (DEPRECATED_NETWORKS.includes(n.id)) return true;
      return n.rpc || (FALLBACK_RPCS[n.id] && FALLBACK_RPCS[n.id].length > 0);
    });
  }

  async function checkAllBalances() {
    error = "";
    results = [];

    const addr = addressInput.trim();
    if (!addr) { error = "Introduce una dirección de wallet"; return; }
    if (!isValidAddress(addr)) { error = "Dirección inválida (debe ser 0x...)"; return; }

    checking = true;
    let networks = buildNetworkList();

    // Filtrar por red específica si se seleccionó una
    if (selectedNetwork !== "all") {
      networks = networks.filter(n => n.id === selectedNetwork);
    }

    const batch = networks.map(async (net) => {
      const rpcs = (net.rpc ? [net.rpc] : []).concat(FALLBACK_RPCS[net.id] || []);
      const filteredRpcs = [...new Set(rpcs.filter(Boolean))];

      if (DEPRECATED_NETWORKS.includes(net.id)) {
        return {
          network: net.name, chainId: net.id, ticker: net.ticker,
          balance: null, status: "deprecated", error: "Red cerrada",
          explorer: net.explorer,
        };
      }

      if (filteredRpcs.length === 0) {
        return {
          network: net.name, chainId: net.id, ticker: net.ticker,
          balance: null, status: "error", error: "Sin RPC configurado",
          explorer: net.explorer,
        };
      }

      const result = await tryFetchBalance(filteredRpcs, addr);
      if (result) {
        return {
          network: net.name, chainId: net.id, ticker: net.ticker,
          balance: result.balance, block: result.block,
          status: "ok", explorer: net.explorer, error: null,
        };
      }

      let lastErr = "";
      for (const url of filteredRpcs) {
        try {
          await rpcCall(url, "eth_blockNumber", [], 3000);
        } catch (e) { lastErr = e.message; }
      }

      return {
        network: net.name, chainId: net.id, ticker: net.ticker,
        balance: null, status: "error",
        error: getErrorReason(net.id, lastErr),
        explorer: net.explorer,
      };
    });

    const settled = await Promise.allSettled(batch);
    results = settled.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { network: "?", chainId: "", ticker: "", balance: null, status: "error", error: "Error interno" },
    );
    checking = false;
  }
</script>

<div class="space-y-8" in:fade>
  <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 shadow-2xl">
    <div class="flex items-center gap-5 mb-8">
      <div class="w-14 h-14 bg-anti-accent/10 rounded-2xl flex items-center justify-center border border-anti-accent/20 text-anti-accent">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 class="text-white font-cinzel text-xl font-black tracking-tight">Consultar Saldo Multi-Red</h3>
        <p class="text-[10px] text-anti-accent font-black uppercase tracking-wider">Sin conexión de wallet • Todas las redes EVM</p>
      </div>
    </div>

    <div class="space-y-6">
      <div class="space-y-3">
        <label for="balanceAddress" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4">
          Dirección de Wallet
        </label>
        <div class="flex flex-col gap-3">
          <div class="flex gap-2">
            <input
              id="balanceAddress"
              type="text"
              bind:value={addressInput}
              placeholder="0x... (Dirección pública)"
              class="flex-1 bg-black border border-anti-border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-sm"
            />
            <button
              on:click={checkAllBalances}
              disabled={checking || !addressInput.trim()}
              class="px-8 py-4 bg-anti-accent text-white font-black font-cinzel rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all text-sm tracking-wider shadow-[0_0_15px_rgba(230,0,0,0.3)]"
            >
              {checking ? "CONSULTANDO..." : "CONSULTAR"}
            </button>
          </div>
          <div class="flex gap-2">
            <select
              bind:value={selectedNetwork}
              class="flex-1 bg-black border border-anti-border rounded-2xl px-6 py-3 text-white focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-xs"
            >
              <option value="all">Todas las redes</option>
              {#each buildNetworkList() as net}
                <option value={net.id}>{net.name} ({net.ticker})</option>
              {/each}
            </select>
          </div>
        </div>
        {#if error}
          <div class="text-[10px] text-red-500 font-bold uppercase ml-4">{error}</div>
        {/if}
      </div>

      {#if checking}
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <div class="w-12 h-12 border-4 border-anti-accent border-t-transparent rounded-full animate-spin"></div>
          <span class="text-[10px] text-white/40 font-black uppercase tracking-widest">Consultando {buildNetworkList().length} redes...</span>
        </div>
      {/if}

      {#if results.length > 0 && !checking}
        <div class="border-t border-anti-border pt-6" transition:slide>
          <div class="flex items-center justify-between mb-6">
            <h4 class="text-xs font-black text-white/70 uppercase tracking-widest">
              Resultados para {shortAddr(addressInput.trim())}
            </h4>
            <span class="text-[9px] text-white/30 font-mono">
              {results.filter(r => r.status === 'ok').length}/{results.length} redes disponibles
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {#each results as result}
              <div class="bg-black/40 border border-anti-border rounded-2xl p-5 hover:border-anti-accent transition-all group">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[9px] font-black text-white/50 uppercase tracking-wider">{result.network}</span>
                  <div class="flex items-center gap-2">
                    {#if result.status === 'ok'}
                      <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    {:else if result.status === 'deprecated'}
                      <div class="w-2 h-2 rounded-full bg-gray-500"></div>
                    {:else}
                      <div class="w-2 h-2 rounded-full bg-red-500"></div>
                    {/if}
                    <span class="text-[8px] font-mono text-white/30">{result.chainId}</span>
                  </div>
                </div>
                {#if result.status === 'ok'}
                  <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-cinzel font-black text-white">
                      {parseFloat(result.balance).toFixed(6)}
                    </span>
                    <span class="text-xs font-black text-anti-accent tracking-wider">{result.ticker}</span>
                  </div>
                  {#if result.explorer}
                    <a
                      href="{result.explorer}/address/{addressInput.trim()}"
                      target="_blank"
                      class="inline-flex items-center gap-1 mt-3 text-[8px] text-white/20 hover:text-anti-accent transition-colors font-mono"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Explorador
                    </a>
                  {/if}
                {:else}
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-red-400/60 font-mono">
                      {result.status === 'deprecated' ? 'Red cerrada' : 'No disponible'}
                    </span>
                    {#if result.error}
                      <span class="text-[7px] text-white/20 font-mono truncate" title={result.error}>
                        {result.error}
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else if results.length === 0 && !checking && addressInput.trim()}
        <div class="flex flex-col items-center justify-center py-16 border border-dashed border-anti-border rounded-3xl opacity-30">
          <svg class="w-12 h-12 mb-4 text-anti-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="font-cinzel text-xs uppercase tracking-widest text-center">Presiona "Consultar" para buscar</p>
        </div>
      {/if}
    </div>
  </section>
</div>
