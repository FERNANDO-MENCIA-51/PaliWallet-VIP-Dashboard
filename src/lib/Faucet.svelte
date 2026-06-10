<script>
  import { ethers } from "ethers";
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";

  const CONTRACT_ADDRESS = "0xe6868E13E60c58839819967B50fe76324efBD5e9";
  const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com/";
  const SEPOLIA_CHAIN_ID = "11155111";


  const FAUCET_ABI = [
    "function claim() external",
    "function claimTo(address recipient) external",
    "function getFaucetBalance() view returns (uint256)",
    "function getRemainingCooldown(address claimant) view returns (uint256)",
    "function claimAmount() view returns (uint256)",
    "function cooldownSeconds() view returns (uint256)",
    "function setClaimAmount(uint256) external",
    "function setCooldown(uint256) external",
  ];

  let recipientAddress = "";
  let requesting = false;
  let faucetError = "";
  let faucetSuccess = "";
  let txHash = "";
  let faucetHistory = [];
  let faucetBalance = "";
  let faqOpen = false;

  onMount(() => {
    loadHistory();
    checkFaucetBalance();
  });

  async function api(method, path, body) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function loadHistory() {
    try {
      const data = await api("GET", "/faucet-history");
      faucetHistory = Array.isArray(data) ? data : [];
    } catch (e) {
      faucetHistory = [];
    }
  }

  async function addHistoryEntry(entry) {
    faucetHistory = [entry, ...faucetHistory];
    try {
      await api("POST", "/faucet-history", { address: entry.address, txHash: entry.txHash });
    } catch (e) {}
  }

  function getPrivateKey() {
    return "0x2e8cc585b277fac2dd4901c398e8835c93140d8561b08638f661e3e34f12f60d";
  }

  let claimAmountDisplay = "";
  let cooldownDisplay = "";

  async function checkFaucetBalance() {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FAUCET_ABI, provider);

      const [bal, amount, cooldown] = await Promise.all([
        contract.getFaucetBalance().catch(() => null),
        contract.claimAmount().catch(() => null),
        contract.cooldownSeconds().catch(() => null),
      ]);

      if (bal !== null) faucetBalance = ethers.formatEther(bal);
      if (amount !== null) claimAmountDisplay = ethers.formatEther(amount);
      if (cooldown !== null) cooldownDisplay = (Number(cooldown) / 3600).toFixed(0) + "h";
    } catch (e) {}
  }

  async function requestTokens() {
    faucetError = "";
    faucetSuccess = "";
    txHash = "";

    const targetAddress = recipientAddress.trim();
    if (!targetAddress) {
      faucetError = "Introduce tu dirección de wallet";
      return;
    }
    if (!ethers.isAddress(targetAddress)) {
      faucetError = "Dirección inválida";
      return;
    }

    const pk = getPrivateKey();
    if (!pk) {
      faucetError = "Faucet no configurado.";
      return;
    }

    requesting = true;
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const wallet = new ethers.Wallet(pk, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FAUCET_ABI, wallet);

      let tx = await contract["claimTo(address)"](targetAddress);

      txHash = tx.hash;
      addHistoryEntry({
        address: targetAddress,
        txHash: tx.hash,
        timestamp: new Date().toISOString(),
        network: "Sepolia",
        status: "Pending",
      });

      await tx.wait(1);

      faucetHistory = faucetHistory.map((e) =>
        e.txHash === tx.hash ? { ...e, status: "Confirmed" } : e,
      );
      try { await api("PUT", `/faucet-history/${tx.hash}`); } catch (e) {}

      faucetSuccess = "Tokens enviados exitosamente";
      recipientAddress = "";
      checkFaucetBalance();
    } catch (err) {
      console.error("Faucet error:", err);
      if (err.code === "CALL_EXCEPTION") {
        faucetError = "El contrato rechazó la llamada. El faucet puede estar vacío o el cooldown activo.";
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        faucetError = "La wallet del faucet no tiene fondos para pagar gas.";
      } else {
        faucetError = err.message || "Error al solicitar tokens";
      }
    } finally {
      requesting = false;
    }
  }

  async function clearHistory() {
    faucetHistory = [];
    try { await api("DELETE", "/faucet-history"); } catch (e) {}
  }

  function shortAddr(addr) {
    if (!addr || addr.length < 12) return addr;
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }
</script>

<div class="grid grid-cols-1 xl:grid-cols-2 gap-8" in:fade>
  <div class="flex flex-col gap-8">
    <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 shadow-2xl">
      <div class="flex items-center gap-5 mb-8">
        <div class="w-14 h-14 bg-anti-accent/10 rounded-2xl flex items-center justify-center border border-anti-accent/20 text-anti-accent">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h3 class="text-white font-cinzel text-xl font-black tracking-tight">Faucet Sepolia</h3>
          <p class="text-[10px] text-anti-accent font-black uppercase tracking-wider">Sin conexión de wallet • Automatizado por contrato</p>
          {#if faucetBalance}
            <p class="text-[8px] text-white/30 font-mono mt-1">
              Balance: {parseFloat(faucetBalance).toFixed(2)} FDEV
              {#if claimAmountDisplay}
                | Claim: {claimAmountDisplay} FDEV | Cooldown: {cooldownDisplay}
              {/if}
            </p>
          {/if}
        </div>
      </div>

      <div class="space-y-6">
        <div class="space-y-3">
          <label for="faucetAddress" class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-4">
            Tu dirección de wallet
          </label>
          <input
            id="faucetAddress"
            type="text"
            bind:value={recipientAddress}
            placeholder="0x... (dirección donde recibirás los tokens)"
            class="w-full bg-black border border-anti-border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:border-anti-accent focus:ring-4 focus:ring-anti-accent/10 outline-none transition-all font-mono text-sm"
          />
        </div>

        {#if faucetError}
          <div class="p-4 bg-red-900/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase" transition:slide>{faucetError}</div>
        {/if}

        {#if faucetSuccess}
          <div class="p-4 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between" transition:slide>
            <span class="text-[10px] font-black text-green-500 uppercase">{faucetSuccess}</span>
          </div>
        {/if}

        {#if txHash}
          <div class="p-4 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between" transition:slide>
            <div class="truncate mr-4">
              <span class="block text-[10px] font-black text-green-500 uppercase">Transacción enviada</span>
              <span class="text-[9px] text-white/40 font-mono">{txHash}</span>
            </div>
            <a
              href="https://sepolia.etherscan.io/tx/{txHash}"
              target="_blank"
              class="px-4 py-2 bg-green-500 text-black font-black rounded-xl text-[9px] uppercase tracking-wider shrink-0"
            >
              Ver Tx
            </a>
          </div>
        {/if}

        <button
          on:click={requestTokens}
          disabled={requesting || !recipientAddress.trim()}
          class="w-full py-6 bg-white text-black font-black font-cinzel text-xl rounded-2xl hover:bg-anti-accent hover:text-white transition-all duration-500 disabled:opacity-20 shadow-2xl"
        >
          {requesting ? "ENVIANDO..." : "SOLICITAR TOKENS"}
        </button>
      </div>
    </section>

    <section class="bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 shadow-2xl">
      <button
        on:click={() => faqOpen = !faqOpen}
        class="w-full flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-anti-accent/10 rounded-xl flex items-center justify-center border border-anti-accent/20 text-anti-accent">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-white font-cinzel text-lg font-black tracking-tight">¿Cómo funciona?</h3>
        </div>
        <svg class="w-5 h-5 text-white/40 transition-transform {faqOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if faqOpen}
        <div class="mt-6 space-y-4 text-xs text-white/50 leading-relaxed" transition:slide>
          <p>1. Ingresa tu dirección de wallet para recibir FDEV.</p>
          <p>2. Presiona "Solicitar Tokens" — la dApp firma la tx automáticamente.</p>
          <p>3. No necesitas conectar tu wallet ni pagar gas.</p>
          <p>4. El contrato faucet distribuye {claimAmountDisplay || '10'} FDEV cada {cooldownDisplay || '24h'}.</p>
        </div>
      {/if}
    </section>
  </div>

  <div class="flex flex-col gap-8">
    <section class="bg-anti-surface/50 border border-anti-border rounded-[2.5rem] p-10 h-full flex flex-col shadow-xl">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-anti-accent/10 rounded-xl flex items-center justify-center border border-anti-accent/20 text-anti-accent">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="font-cinzel text-xl font-black text-white uppercase tracking-tight">Historial Faucet</h3>
        </div>
        {#if faucetHistory.length > 0}
          <button
            on:click={clearHistory}
            class="text-[9px] text-white/30 hover:text-anti-accent uppercase tracking-widest font-black transition-colors"
          >
            Limpiar
          </button>
        {/if}
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {#if faucetHistory.length > 0}
          {#each faucetHistory as entry}
            <div class="bg-black/60 border border-anti-border p-5 rounded-2xl flex items-center justify-between group hover:border-anti-accent transition-all">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-anti-accent/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-anti-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs font-black text-white uppercase tracking-widest">
                    {shortAddr(entry.address)}
                  </div>
                  <div class="text-[9px] text-white/30 font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <div class="text-[9px] font-black uppercase tracking-widest {entry.status === 'Confirmed' ? 'text-green-500' : 'text-yellow-500'}">
                    {entry.status}
                  </div>
                </div>
                {#if entry.txHash}
                  <a
                    href="https://sepolia.etherscan.io/tx/{entry.txHash}"
                    target="_blank"
                    class="p-2 bg-white/5 rounded-lg hover:bg-anti-accent transition-colors group/link"
                  >
                    <svg class="w-3.5 h-3.5 text-white/40 group-hover/link:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                {/if}
              </div>
            </div>
          {/each}
        {:else}
          <div class="flex flex-col items-center justify-center h-60 opacity-20">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-[10px] font-black uppercase tracking-[0.3em]">Sin actividad de faucet</p>
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
