<script>
  // @ts-nocheck
  import { ethers } from "ethers";
  const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ];
  let TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // Se cargará dinámicamente desde localStorage fdev_token_address
  
  function updateTokenAddress() {
    const saved = localStorage.getItem("fdev_token_address");
    if (saved && ethers.isAddress(saved)) {
      TOKEN_ADDRESS = saved;
    } else {
      TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
    }
  }

  let tokenBalance = "";
  let tokenSymbol = "TSYS";
  let tokenDecimals = 18;
  const PRIMARY_ACCOUNT = "0x48e29Ec3a874FF754BE17D96dBE084dF54202B03"; // Tu cuenta principal con saldo

  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import Intro from "./lib/Intro.svelte";
  import Wallet from "./lib/Wallet.svelte";
  import Networks from "./lib/Networks.svelte";
  import Contracts from "./lib/Contracts.svelte";
  import BalanceChecker from "./lib/BalanceChecker.svelte";
  import Faucet from "./lib/Faucet.svelte";
  import {
    getExplorerApiUrl,
    getExplorerBase,
    getNetworkName,
    getNetworkTicker,
    EVM_NETWORKS,
    UTXO_NETWORKS,
  } from "./lib/config/networks.js";
  import { fetchWithRetry } from "./composables/retry.js";

  // Nota: al estar en el frontend, esta clave queda visible en el bundle final.
  // Si quieres usarla fija en nube, pégala aquí.
  const ETHERSCAN_API_KEY = "BJZQDBBWHAM5X9PVTWUBCCT7DXX4ZMAUVF";

  let address = "";
  let balance = "";
  let isSwitching = false;
  let chainId = "";
  let error = "";
  let connected = false;
  let loading = false;
  let historyLoading = false;
  /** @type {any} */
  let provider = null;
  /** @type {any} */
  let signer = null;
  /** @type {any[]} */
  let history = [];
  /** @type {any[]} */
  let tokenHistory = [];
  /** @type {any[]} */
  let explorerHistory = [];
  /** @type {any[]} */
  let liveHistory = (() => {
    try {
      const saved = localStorage.getItem("fdev_live_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {}
    return [];
  })();
  const HISTORY_PAGE_SIZE = 10;
  let historyPage = 1;
  let historyHasNextPage = false;
  let activeTab = "intro";
  let showNetworkDropdown = false;
  let showToolsDropdown = false;
  let showAllNetworks = false;
  let showInitialLoader = true;
  let hiddenNetworks = JSON.parse(
    localStorage.getItem("pali_hidden_networks") || "[]",
  );

  function toggleHideNetwork(id) {
    if (hiddenNetworks.includes(id)) {
      hiddenNetworks = hiddenNetworks.filter((n) => n !== id);
    } else {
      hiddenNetworks = [...hiddenNetworks, id];
    }
    localStorage.setItem(
      "pali_hidden_networks",
      JSON.stringify(hiddenNetworks),
    );
  }

  function loadPersistedLiveHistory() {
    try {
      const saved = localStorage.getItem("fdev_live_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) liveHistory = parsed;
      }
    } catch (e) {}
  }

  function savePersistedLiveHistory() {
    try {
      localStorage.setItem(
        "fdev_live_history",
        JSON.stringify(liveHistory.slice(0, 20)),
      );
    } catch (e) {}
  }

  function resetHistoryPagination() {
    historyPage = 1;
    historyHasNextPage = false;
    explorerHistory = [];
    tokenHistory = [];
  }

  function clearLegacyLocalHistory() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("pali_history_"))
      .forEach((key) => localStorage.removeItem(key));
  }

  const tabs = [
    {
      id: "intro",
      label: "Inicio",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      id: "wallet",
      label: "Dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      id: "networks",
      label: "Redes",
      icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
    },
    {
      id: "contracts",
      label: "Contratos",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "saldo",
      label: "Saldo",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "faucet",
      label: "Faucet",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    }
  ];

  onMount(async () => {
    clearLegacyLocalHistory();
    initAnimations();
    updateTokenAddress();
    try {
      await tryAutoReconnect();
    } finally {
      showInitialLoader = false;
    }

    const win = window;
    const ethereum = win["ethereum"];
    if (ethereum) {
      ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          const foundMain = accounts.find(
            (a) => a.toLowerCase() === PRIMARY_ACCOUNT.toLowerCase(),
          );
          address = foundMain || accounts[0];
          resetHistoryPagination();
          connected = true;
          refreshBalance();
        } else if (!win["sessionStorage"].getItem("pali_switching") && !loading) {
          disconnect();
        }
      });

      ethereum.on("chainChanged", async (hex) => {
        chainId = parseInt(hex, 16).toString();
        resetHistoryPagination();
        const eth = win["ethereum"];
        provider = new ethers.BrowserProvider(eth);
        try {
          signer = await provider.getSigner();
        } catch (e) {
          console.warn("Could not get signer on chain change:", e);
        }
        refreshBalance();
        loadExplorerHistory(1);
      });
    }
  });

  function initAnimations() {
    const win = window;
    if (typeof win["anime"] !== "undefined") {
      win["anime"]({
        targets: ".clover-leaf",
        scale: [0, 1],
        opacity: [0, 1],
        delay: win["anime"].stagger(200),
        easing: "easeOutElastic(1, .8)",
      });
    }
  }

  $: if (activeTab) {
    updateTokenAddress();
  }

  $: if (address && chainId) {
    refreshBalance();
  }
  $: history = mergeHistory(
    liveHistory,
    explorerHistory,
    tokenHistory,
  );

  async function loadTokenBalance() {
    if (!address || !provider) return;
    try {
      const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      const code = await provider.getCode(TOKEN_ADDRESS);
      if (code === "0x" || code === "0x0") {
        tokenBalance = "0";
        return;
      }
      const [bal, dec, sym] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals().catch(() => 18),
        contract.symbol().catch(() => "TOKEN"),
      ]);
      tokenDecimals = Number(dec);
      tokenSymbol = sym;
      tokenBalance = ethers.formatUnits(bal, tokenDecimals);
    } catch (err) {
      console.warn("Token not available on this network");
      tokenBalance = "0";
    }
  }

  function mergeHistory(...groups) {
    const seen = new Set();
    return groups
      .flat()
      .filter((tx) => {
        if (!tx || !tx.hash) return false;
        const key = `${tx.hash}_${tx.assetSymbol || ""}_${tx.type || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime(),
      );
  }

  function buildExplorerHistoryUrl(apiUrl, params) {
    const query = new URLSearchParams(params);
    const apiKey = ETHERSCAN_API_KEY.trim();
    if (apiKey) query.set("apikey", apiKey);
    return `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}${query.toString()}`;
  }

  function getExplorerRows(payload, emptyLabel = "No transactions found") {
    if (Array.isArray(payload?.result)) return payload.result;

    const message = String(payload?.message || "");
    const result = String(payload?.result || "");
    const isEmptyResponse =
      message.toLowerCase().includes(emptyLabel.toLowerCase()) ||
      result.toLowerCase().includes(emptyLabel.toLowerCase()) ||
      result.toLowerCase().includes("no records found");

    if (isEmptyResponse) return [];

    throw new Error(result || message || "Explorer API error");
  }

  async function loadExplorerHistory(page = historyPage) {
    if (!address || !chainId || chainId === "utxo") return;
    const apiUrl = getExplorerApiUrl(chainId);
    if (!apiUrl) {
      explorerHistory = [];
      historyHasNextPage = false;
      return;
    }
    historyLoading = true;
    try {
      historyPage = page;
      const params = {
        module: "account",
        action: "txlist",
        address,
        startblock: "0",
        endblock: "99999999",
        page: String(page),
        offset: String(HISTORY_PAGE_SIZE),
        sort: "desc",
      };
      const response = await fetchWithRetry(
        buildExplorerHistoryUrl(apiUrl, params),
      );
      const payload = await response.json();
      const rows = getExplorerRows(payload, "No transactions found");
      historyHasNextPage = rows.length === HISTORY_PAGE_SIZE;
      const ticker = getNetworkTicker(chainId);
      explorerHistory = rows
        .filter((tx) => tx.hash)
        .map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: ethers.formatEther(tx.value || "0"),
          type:
            String(tx.to || "").toLowerCase() === address.toLowerCase()
              ? "Received"
              : "Sent",
          timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          chainId,
          networkName: getNetworkName(chainId, address),
          explorerBase: getExplorerBase(chainId),
          assetSymbol: ticker,
          status: tx.isError === "1" ? "Failed" : "Confirmed",
        }));
    } catch (err) {
      console.error("Explorer history load failed:", err);
      historyHasNextPage = false;
    } finally {
      historyLoading = false;
    }
  }

  async function loadPreviousHistoryPage() {
    if (historyLoading || historyPage <= 1) return;
    const page = historyPage - 1;
    await loadExplorerHistory(page);
    await loadTokenTransferHistory(page);
  }

  async function loadNextHistoryPage() {
    if (historyLoading || !historyHasNextPage) return;
    const page = historyPage + 1;
    await loadExplorerHistory(page);
    await loadTokenTransferHistory(page);
  }

  async function loadTokenTransferHistory(page = historyPage) {
    if (!address || !chainId || chainId === "utxo" || !address.startsWith("0x")) return;
    const apiUrl = getExplorerApiUrl(chainId);
    if (!apiUrl) {
      tokenHistory = [];
      return;
    }
    try {
      const params = {
        module: "account",
        action: "tokentx",
        address,
        startblock: "0",
        endblock: "99999999",
        page: String(page),
        offset: String(HISTORY_PAGE_SIZE),
        sort: "desc",
      };
      const response = await fetchWithRetry(
        buildExplorerHistoryUrl(apiUrl, params),
      );
      const payload = await response.json();
      const rows = getExplorerRows(payload, "No token transfers found");
      tokenHistory = rows
        .filter((tx) => tx.hash)
        .map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: ethers.formatUnits(
            tx.value || "0",
            Number(tx.tokenDecimal || 18),
          ),
          type:
            String(tx.to || "").toLowerCase() === address.toLowerCase()
              ? "Received"
              : "Sent",
          timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
          chainId,
          networkName: getNetworkName(chainId, address),
          explorerBase: getExplorerBase(chainId),
          assetSymbol: tx.tokenSymbol || "TOKEN",
          status: "Confirmed",
          logIndex: tx.logIndex,
        }));
    } catch (err) {
      console.warn("Token history not available");
      tokenHistory = [];
    }
  }

  function trackLiveTransaction(tx) {
    if (!tx?.hash || !address) return;
    const liveTx = {
      hash: tx.hash,
      from: address,
      to: tx.to,
      amount: tx.amount || "0",
      type: tx.type || "Sent",
      timestamp: tx.timestamp || new Date().toISOString(),
      chainId,
      networkName: getNetworkName(chainId, address),
      explorerBase: getExplorerBase(chainId),
      assetSymbol: tx.assetSymbol || getNetworkTicker(chainId, address),
      status: tx.status || "Pending",
      source: "live",
    };
    liveHistory = [
      liveTx,
      ...liveHistory.filter((item) => item.hash !== liveTx.hash),
    ];
    savePersistedLiveHistory();
  }

  async function handleTransactionConfirmed(tx) {
    if (tx?.hash) trackLiveTransaction({ ...tx, status: "Confirmed" });
    if (connected && address && !isSwitching) {
      try {
        const eth = window["ethereum"];
        if (eth) {
          provider = new ethers.BrowserProvider(eth);
          const rawBalance = await provider.getBalance(address);
          balance = ethers.formatEther(rawBalance);
          loadTokenBalance();
        }
      } catch (err) {
        console.warn("Balance refresh after tx failed:", err);
      }
    }
  }

  let lastSyncTime = 0;
  async function syncAccount(silent = false, skipLoadingFinish = false, showLoading = true) {
    if (Date.now() - lastSyncTime < 2000) return;
    lastSyncTime = Date.now();

    if (showLoading) loading = true;
    try {
      const win = window;
      const ethereum = win["ethereum"];
      if (!ethereum) return;

      if (!silent) {
        // Show a hint to the user
        console.log("Requesting account sync...");

        // Set a safety timeout
        const timeout = setTimeout(() => {
          if (loading) {
            alert(
              "Pali Wallet no responde. Por favor, abre la extensión manualmente y verifica si hay notificaciones pendientes.",
            );
            loading = false;
          }
        }, 10000);

        try {
          await ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
          clearTimeout(timeout);
        } catch (e) {
          clearTimeout(timeout);
          throw e;
        }
      }

      let accounts = [];
      let attempts = 0;
      while (accounts.length === 0 && attempts < 5) { // Increased to 5 attempts
        try {
          // Try both methods
          accounts = await ethereum.request({ method: "eth_accounts" });
          if (accounts.length === 0) {
            accounts = await ethereum.request({ method: "eth_requestAccounts" });
          }
        } catch (e) { console.log("Retry attempt failed:", e); }
        
        if (accounts.length === 0) {
          attempts++;
          await new Promise(r => setTimeout(r, 600)); 
        }
      }

      if (accounts.length > 0) {
        const foundMain = accounts.find(
          (a) => a.toLowerCase() === PRIMARY_ACCOUNT.toLowerCase(),
        );
        address = foundMain || accounts[0];
        resetHistoryPagination();

        provider = new ethers.BrowserProvider(ethereum);
        signer = await provider.getSigner();
        const net = await provider.getNetwork();
        chainId = net.chainId.toString();
        connected = true;
        await refreshBalance();
      } else {
        // If still no accounts, we might need a hard reconnect
        console.warn("No accounts found after sync retry");
        if (!skipLoadingFinish) {
          connected = false;
        }
      }
    } catch (err) {
      console.error("Sync account failed:", err);
      if (!skipLoadingFinish) {
        connected = false;
      }
    } finally {
      if (!skipLoadingFinish && showLoading) loading = false;
    }
  }

  async function tryAutoReconnect() {
    const win = window;
    if (!win["sessionStorage"].getItem("pali_connected")) return;
    const ethereum = win["ethereum"];
    const pali = win["pali"];
    try {
      if (ethereum) {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          const foundMain = accounts.find(
            (a) => a.toLowerCase() === PRIMARY_ACCOUNT.toLowerCase(),
          );
          address = foundMain || accounts[0];
          resetHistoryPagination();
          win["sessionStorage"].removeItem("pali_switching");
          provider = new ethers.BrowserProvider(ethereum);
          signer = await provider.getSigner();
          const network = await provider.getNetwork();
          chainId = network.chainId.toString();
          connected = true;
          activeTab = "wallet";
          await refreshBalance();
          return;
        }
      }
      if (pali) {
        const account = await pali.request({ method: "sys_getAccount" });
        if (account) {
          address = account.address;
          resetHistoryPagination();
          balance = account.balance;
          chainId = "utxo";
          connected = true;
          activeTab = "wallet";
          return;
        }
      }
    } catch (err) {
      console.error("Reconnect error:", err);
    } finally {
      loading = false;
    }
  }

  async function refreshBalance() {
    if (!connected || !address || isSwitching) return;
    try {
      const win = window;
      if (address.startsWith("0x")) {
        const eth = win["ethereum"];
        if (!eth) return;
        provider = new ethers.BrowserProvider(eth);
        const rawBalance = await provider.getBalance(address);
        balance = ethers.formatEther(rawBalance);
        loadTokenBalance();
        loadExplorerHistory();
        loadTokenTransferHistory();
      } else {
        const pali = win["pali"];
        if (pali) {
          const account = await pali.request({ method: "sys_getAccount" });
          if (account) {
            address = account.address;
            balance = account.balance;
            chainId = "utxo";
          }
        }
      }
    } catch (err) {
      console.warn("Sync refresh failed:", err);
    }
  }

  async function connectWallet() {
    loading = true;
    error = "";
    try {
      const win = window;
      const ethereum = win["ethereum"];
      const pali = win["pali"];
      if (!ethereum && !pali) {
        error = "Pali Wallet not detected";
        return;
      }
      if (ethereum) {
        try {
          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts.length > 0) {
            const foundMain = accounts.find(
              (a) => a.toLowerCase() === PRIMARY_ACCOUNT.toLowerCase(),
            );
            address = foundMain || accounts[0];
            resetHistoryPagination();
            provider = new ethers.BrowserProvider(ethereum);
            signer = await provider.getSigner();
            const network = await provider.getNetwork();
            chainId = network.chainId.toString();
            connected = true;
            activeTab = "wallet";
            win["sessionStorage"].setItem("pali_connected", "true");
            await refreshBalance();
            return;
          }
        } catch (e) {
          console.log("EVM connection attempt skipped:", e);
        }
      }
      if (!connected && pali) {
        const account = await pali.request({ method: "sys_getAccount" });
        if (account) {
          address = account.address;
          resetHistoryPagination();
          balance = account.balance;
          chainId = "utxo";
          connected = true;
          activeTab = "wallet";
          win["sessionStorage"].setItem("pali_connected", "true");
          return;
        }
      }
      if (!connected) error = "No se pudo conectar ninguna cuenta activa.";
    } catch (err) {
      console.error("Connection error:", err);
      error = err["message"] || String(err);
    } finally {
      loading = false;
    }
  }

  function disconnect() {
    address = "";
    resetHistoryPagination();
    connected = false;
    activeTab = "intro";
    sessionStorage.removeItem("pali_connected");
    try {
      const eth = window["ethereum"];
      if (eth) {
        eth.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }).catch(() => {});
      }
    } catch (e) {}
    ["fdev_token_address", "fdev_live_history", "fdev_contacts", "pali_hidden_networks"].forEach((k) => localStorage.removeItem(k));
  }

  async function switchNetwork(net) {
    if (isSwitching) return;
    isSwitching = true;
    try {
      const win = window;
      const ethereum = win["ethereum"];
      if (!ethereum) return;
      
      if (chainId === "utxo") {
        address = "";
        resetHistoryPagination();
        connected = false;
        win["sessionStorage"].removeItem("pali_connected");
        win["sessionStorage"].setItem("pali_switching", "true");
        await tick();
        loading = true;
        await new Promise((r) => setTimeout(r, 1500));
        try {
          await ethereum.request({ method: "eth_requestAccounts" });
        } catch (e) {}
      } else {
        win["sessionStorage"].setItem("pali_switching", "true");
      }

      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: net.chainHex }],
      });

      const delay = chainId === "utxo" ? 2000 : 500;
      await new Promise((r) => setTimeout(r, delay));
      await syncAccount(true, true, false); // Keep loading false for instant switch

      showNetworkDropdown = false;
      activeTab = "wallet";
      win["sessionStorage"].removeItem("pali_switching");
      
      // Release lock so refreshBalance can execute immediately
      isSwitching = false;
      await refreshBalance();
      loading = false; // Now it's safe to stop loading
    } catch (err) {
      const errorObj = err;
      if (errorObj["code"] === 4902) {
        try {
          const eth = window["ethereum"];
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: net.chainHex,
                chainName: net.name,
                rpcUrls: [net.rpc],
                nativeCurrency: {
                  name: net.ticker,
                  symbol: net.ticker,
                  decimals: 18,
                },
                blockExplorerUrls: net.explorer ? [net.explorer] : undefined,
              },
            ],
          });
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: net.chainHex }],
          });
          showNetworkDropdown = false;
          activeTab = "wallet";
          win["sessionStorage"].removeItem("pali_switching");
          await syncAccount(true, true, false);
          await refreshBalance();
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
        return;
      }
      console.error("Error switching network:", err);
    } finally {
      isSwitching = false;
      loading = false;
    }
  }

  async function switchUtxoNetwork(net) {
    if (isSwitching) return;
    isSwitching = true;
    try {
      const win = window;
      const pali = win["pali"];
      if (!pali) return;
      address = "";
      resetHistoryPagination();
      connected = false;
      win["sessionStorage"].setItem("pali_switching", "true");
      let targetChainId = 57;
      if (net.id === "bitcoin" || net.id === "bitcoin-mainnet")
        targetChainId = "bitcoin";
      if (net.id === "syscoin-testnet-utxo") targetChainId = 5700;

      await pali.request({
        method: "sys_changeUTXOEVM",
        params: [{ chainId: targetChainId }],
      });

      await new Promise((r) => setTimeout(r, 1500));
      const account = await pali.request({ method: "sys_getAccount" });
      if (account) {
        address = account.address;
        resetHistoryPagination();
        balance = account.balance;
        chainId = "utxo";
        connected = true;
        activeTab = "wallet";
        win["sessionStorage"].removeItem("pali_switching");
        await refreshBalance();
      }
    } catch (err) {
      console.error("Error switching UTXO:", err);
    } finally {
      isSwitching = false;
    }
  }

  function toggleDropdown() {
    showNetworkDropdown = !showNetworkDropdown;
    if (!showNetworkDropdown) showAllNetworks = false;
  }
  function handleTabClick(tab) {
    if (connected || tab.id === "intro" || tab.id === "saldo" || tab.id === "faucet") activeTab = tab.id;
  }
  function handleGlobalClick() {
    showNetworkDropdown = false;
    showToolsDropdown = false;
  }
</script>

<svelte:window on:click={handleGlobalClick} />

{#if showInitialLoader}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
    out:fade
  >
    <div
      class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--color-anti-accent)_0%,transparent_70%)] animate-pulse"
    ></div>
    <div class="relative flex flex-col items-center">
      <div class="w-40 h-40 relative">
        <svg
          viewBox="0 0 200 200"
          class="w-full h-full drop-shadow-[0_0_20px_rgba(230,0,0,0.8)]"
        >
          <path
            class="clover-leaf fill-anti-accent"
            d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100"
          />
          <path
            class="clover-leaf fill-anti-accent"
            d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100"
          />
          <path
            class="clover-leaf fill-anti-accent"
            d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100"
          />
          <path
            class="clover-leaf fill-anti-accent"
            d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100"
          />
          <path
            class="clover-leaf fill-black stroke-anti-accent stroke-2"
            d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100"
          />
        </svg>
      </div>
      <h1
        class="mt-8 font-cinzel text-4xl font-black tracking-[0.2em] text-white uppercase"
      >
        Fernando <span class="text-anti-accent">Dev</span>
      </h1>
      <div class="mt-4 h-1 w-48 bg-anti-border relative overflow-hidden">
        <div
          class="absolute inset-0 bg-anti-accent animate-[shimmer_2s_infinite]"
        ></div>
      </div>
      <p
        class="mt-4 font-mono text-[10px] text-gray-500 uppercase tracking-widest"
      >
        Sincronizando con la red...
      </p>
    </div>
  </div>
{/if}

<div
  class="min-h-screen bg-anti-bg text-gray-100 flex flex-col selection:bg-anti-accent selection:text-white font-sans"
>
  <nav
    class="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-anti-border px-8 py-5 flex items-center justify-between"
  >
    <div class="flex items-center gap-10">
      <div class="flex items-center gap-3 group cursor-pointer">
        <div
          class="w-10 h-10 bg-anti-accent/10 border border-anti-accent/30 rounded-lg flex items-center justify-center group-hover:bg-anti-accent/20 transition-all"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 200 200"
            class="group-hover:scale-110 transition-transform"
          >
            <path
              d="M100 100 Q130 70 150 55"
              class="stroke-anti-accent stroke-10 fill-none"
            />
            <circle cx="100" cy="100" r="15" class="fill-anti-accent" />
          </svg>
        </div>
        <span class="font-cinzel text-2xl font-black tracking-tighter"
          >FERNANDO<span class="text-anti-accent ml-1">DEV</span></span
        >
      </div>

      <div class="hidden lg:flex gap-2">
        <button
          on:click={() => handleTabClick(tabs[0])}
          class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3
            {activeTab === 'intro'
              ? 'bg-anti-accent text-white shadow-[0_0_20px_rgba(230,0,0,0.3)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'}"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tabs[0].icon} /></svg>
          {tabs[0].label}
        </button>

        {#if connected}
          {#each tabs.slice(1, 4) as tab}
            <button
              on:click={() => handleTabClick(tab)}
              class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3
                {activeTab === tab.id
                  ? 'bg-anti-accent text-white shadow-[0_0_20px_rgba(230,0,0,0.3)]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} /></svg>
              {tab.label}
            </button>
          {/each}
        {/if}

        <div class="relative">
          <button
            on:click|stopPropagation={() => showToolsDropdown = !showToolsDropdown}
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3
              {activeTab === 'saldo' || activeTab === 'faucet'
                ? 'bg-anti-accent text-white shadow-[0_0_20px_rgba(230,0,0,0.3)]'
                : 'text-white/50 hover:text-white hover:bg-white/5'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            Herramientas
            <svg class="w-3 h-3 ml-1 transition-transform {showToolsDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {#if showToolsDropdown}
            <div
              class="absolute left-0 mt-3 w-44 bg-anti-surface border border-anti-border rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95"
            >
              <div class="px-5 py-2 text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">HERRAMIENTAS</div>
              {#each tabs.slice(4) as tab}
                <button
                  on:click={() => { activeTab = tab.id; showToolsDropdown = false; }}
                  class="w-full text-left px-5 py-3 text-xs font-bold hover:bg-anti-accent/10 transition-colors flex items-center gap-3 {activeTab === tab.id ? 'text-anti-accent' : 'text-white/50'}"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} /></svg>
                  {tab.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-6">
      {#if connected}
        <div class="relative">
          <button
            on:click|stopPropagation={toggleDropdown}
            class="flex items-center gap-3 px-4 py-2 bg-anti-surface border border-anti-border rounded-xl text-xs font-black uppercase tracking-widest hover:border-anti-accent transition-all group"
          >
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            {getNetworkName(chainId, address)}
            <button 
              on:click|stopPropagation={() => syncAccount(false)}
              class="p-1 hover:bg-white/5 rounded-lg transition-colors group/sync ml-1"
              aria-label="Sincronizar Cuenta"
            >
              <svg
                class="w-3 h-3 text-white/30 group-hover/sync:text-anti-accent transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                /></svg
              >
            </button>
          </button>
          {#if showNetworkDropdown}
            {@const visibleNetworks = EVM_NETWORKS.filter((n) => !hiddenNetworks.includes(n.id)).sort((a) => (a.id === chainId ? -1 : 0))}
            <div
              class="absolute right-0 mt-3 bg-anti-surface border border-anti-border rounded-2xl shadow-2xl overflow-y-auto max-h-96 custom-scrollbar py-2 animate-in fade-in zoom-in-95"
              class:w-72={showAllNetworks}
              class:w-56={!showAllNetworks}
            >
              <div
                class:grid={showAllNetworks}
                class:grid-cols-2={showAllNetworks}
                class:flex={!showAllNetworks}
                class:flex-col={!showAllNetworks}
              >
                {#each (showAllNetworks ? visibleNetworks : visibleNetworks.slice(0, 6)) as net}
                  <button
                    on:click={() => switchNetwork(net)}
                    class="text-left px-5 py-3 text-xs font-bold hover:bg-anti-accent/10 transition-colors flex items-center justify-between {chainId ===
                    net.id
                      ? 'text-anti-accent'
                      : 'text-white/50'}"
                  >
                    {net.name}
                    {#if chainId === net.id}<div
                        class="w-1.5 h-1.5 rounded-full bg-anti-accent shrink-0"
                      ></div>{/if}
                  </button>
                {/each}
              </div>
              {#if visibleNetworks.length > 6}
                <button
                  on:click|stopPropagation={() => (showAllNetworks = !showAllNetworks)}
                  class="w-full text-center px-5 py-2 text-[10px] font-black uppercase tracking-widest text-anti-accent hover:bg-anti-accent/10 transition-colors border-t border-anti-border/50"
                >
                  {showAllNetworks ? "Ver menos ▲" : "Ver más ▼"}
                </button>
              {/if}
            </div>
          {/if}
        </div>
        <button
          on:click={disconnect}
          class="text-white/40 hover:text-anti-accent transition-colors p-2"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            /></svg
          >
        </button>
      {:else}
        <button
          on:click={connectWallet}
          disabled={loading}
          class="px-8 py-3 bg-anti-accent text-white font-black font-cinzel rounded-lg shadow-[0_0_25px_rgba(230,0,0,0.4)] hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "CONECTANDO..." : "CONECTAR WALLET"}
        </button>
      {/if}
    </div>
  </nav>

  <main class="flex-1 w-full max-w-350 mx-auto p-8 lg:p-16">
    <div class="relative">
      {#if activeTab === "intro"}
        <Intro onConnect={connectWallet} {loading} />
      {:else if activeTab === "wallet"}
        {#if loading}
          <div class="flex flex-col items-center justify-center min-h-100 bg-anti-surface border border-anti-border rounded-[2.5rem] p-10 text-center" in:fade>
            <div class="w-20 h-20 border-4 border-anti-accent border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 class="font-cinzel text-2xl font-black text-white mb-4 uppercase">Sincronizando...</h2>
            <p class="text-white/50 max-w-md">Actualizando conexión con el nuevo protocolo de red.</p>
          </div>
        {:else}
          <Wallet
            {balance}
            {address}
            {chainId}
            {history}
            {tokenBalance}
            {signer}
            {historyLoading}
            {historyPage}
            {historyHasNextPage}
            onHistoryNext={loadNextHistoryPage}
            onHistoryPrevious={loadPreviousHistoryPage}
            onTransactionSubmitted={trackLiveTransaction}
            onTransactionConfirmed={handleTransactionConfirmed}
          />
        {/if}
      {:else if activeTab === "networks"}
          <Networks
          currentChainId={chainId}
          {hiddenNetworks}
          evmNetworks={EVM_NETWORKS}
          utxoNetworks={UTXO_NETWORKS}
          onSwitch={switchNetwork}
          onSwitchUtxo={switchUtxoNetwork}
          onToggleHide={toggleHideNetwork}
        />
      {:else if activeTab === "contracts"}
          <Contracts
          {address}
          {chainId}
          {connected}
          {signer}
          {provider}
        />
      {:else if activeTab === "saldo"}
        <BalanceChecker />
      {:else if activeTab === "faucet"}
        <Faucet />
      {/if}
    </div>
  </main>

  <footer
    class="p-10 border-t border-anti-border flex flex-col items-center gap-4"
  >
    <div
      class="flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
    >
      <span>Protocolo Descentralizado</span>
      <span>Seguridad de Red</span>
      <span>Fernando Dev v4.0</span>
    </div>
    <p class="text-[9px] text-white/50 font-mono italic">
      "Innovación constante para la libertad financiera."
    </p>
  </footer>
</div>

<style>
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>
