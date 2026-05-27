# PROYECTO DE INNOVACIÓN BLOCKCHAIN (PIB)
## Informe de Desarrollo de Actividades de la DApp - Terminal VIP

Este documento consolida el informe de desarrollo y evidencias de implementación para los tres puntos clave de la actividad del Proyecto de Innovación Blockchain (PIB), utilizando como base el repositorio de la organización de **Valle Grande**.

---

# 🌐 ACTIVIDAD 1: Cambio de Red por Proveedor (EVM & UTXO) y Gestión Dinámica de Redes

### Descripción General
Se implementó en la DApp un sistema robusto de conmutación de red que opera según el tipo de proveedor (EVM Networks para contratos inteligentes y UTXO Networks para redes nativas como Bitcoin o Syscoin UTXO). Además, incorpora:
1. **Autocarga/Autoagregado:** Si el proveedor (ej. MetaMask o Pali Wallet) no tiene configurada la red EVM de pruebas que el usuario selecciona, la DApp solicita su inserción automática a través del método `wallet_addEthereumChain`.
2. **Retiro/Ocultación de Redes:** Permite al usuario "retirar" o silenciar redes de prueba del panel visual de la DApp para simplificar su interfaz de trabajo, manteniéndolas en la billetera local.

---

### 💻 Fragmentos de Código Clave (Implementación)

#### A. Definición de Redes y Parámetros (`src/lib/config/networks.js`)
Configuración unificada de los parámetros de RPC y exploradores, incluyendo las funciones para empaquetar los datos que se enviarán a la wallet del navegador:

```javascript
// Estructura de redes EVM admitidas (incluyendo zkSYS, Sepolia, Hoodi, etc.)
export const EVM_NETWORKS = [
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
        tone: 'sky'
    },
    {
        id: '11155111',
        name: 'Sepolia Testnet',
        category: 'EVM Networks',
        chainHex: '0xaa36a7',
        rpc: 'https://rpc.sepolia.org',
        ticker: 'ETH',
        explorer: 'https://sepolia.etherscan.io',
        nativeCurrencyName: 'Sepolia Ether',
        iconText: 'SE',
        tone: 'indigo'
    }
];

// Genera los parámetros estandarizados para registrar la red en el navegador
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
```

#### B. Lógica de Cambio y Autoagregado de Red (`src/App.svelte`)
Implementa el flujo reactivo de conmutación. Si se produce el código de error `4902` (red no existente en la wallet), la DApp la añade de manera transparente:

```javascript
async function switchNetwork(net) {
  if (isSwitching) return;
  isSwitching = true;
  try {
    const ethereum = window["ethereum"];
    if (!ethereum) return;
    
    // Auto-vincular en caso de estar previamente ocultada en la interfaz
    if (hiddenNetworks.includes(net.id)) {
      toggleHideNetwork(net.id);
    }

    // Ejecuta el switch por método estándar RPC
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: net.chainHex }],
    });

    await syncAccount(true);
    await refreshBalance();
  } catch (err) {
    // Código 4902: La red no está registrada en el proveedor (ej. MetaMask)
    if (err["code"] === 4902) {
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
        await syncAccount(true);
      } catch (addError) {
        console.error("Error al registrar red en el proveedor:", addError);
      }
    }
  } finally {
    isSwitching = false;
  }
}
```

#### C. Lógica de Ocultar/Retirar Redes (`src/lib/Networks.svelte`)
Permite desvincular o re-vincular redes de manera elegante interactuando con el array de exclusión `hiddenNetworks`:

```javascript
function confirmToggle(id) {
    const isHidden = hiddenNetworks.includes(id);
    modalConfig = {
        title: isHidden ? 'Agregar Red' : 'Retirar Red',
        message: isHidden 
            ? '¿Quieres volver a vincular esta red al terminal?' 
            : '¿Seguro que quieres retirar esta red del terminal de trabajo?',
        confirmText: isHidden ? 'VINCULAR' : 'RETIRAR PROTOCOLO',
        action: () => {
            onToggleHide(id);
            showModal = false;
        }
    };
    showModal = true;
}
```

---

### 🕹️ Guía de Demostración (Prueba del Punto 1)
1. Abre tu billetera (ej. MetaMask/Pali Wallet) y **elimina la red de prueba Sepolia o Rollux Testnet** de la lista de tus redes configuradas.
2. Ingresa a la sección **Gestión de Redes** de la DApp.
3. Haz clic en **CAMBIAR** sobre la red que acabas de borrar de tu billetera.
4. **Verificación:** Observa cómo la DApp intercepta la ausencia, abre el diálogo nativo de tu billetera y te solicita la autorización para agregar los parámetros de la red de forma 100% automática.
5. Selecciona cualquier red activa y pulsa el botón rojo **Retirar Red** (icono de la equis). Verás que la red se oculta de la pestaña activa, y se transfiere al listado de "Redes Eliminadas" para simplificar la interfaz.

---
---

# 📊 ACTIVIDAD 2: Historial de Transacciones Filtrado por Red Activa (API del Explorador)

### Descripción General
Se construyó un historial de transacciones dinámico en el Dashboard principal que extrae la actividad en tiempo real del usuario.
- **Acceso Directo al Explorador:** Realiza solicitudes directas utilizando la API correspondiente del explorador de bloques (Blockscout o Etherscan) configurada para cada red EVM.
- **Filtro Automático por Red:** Al cambiar la red activa del terminal (ej. de Rollux Testnet a Sepolia Testnet, zkSYS o Hoodi), la DApp calcula la URL de la API correspondiente a la red en la que se encuentra y re-consulta el historial del usuario, mostrando únicamente las transferencias del token o activo de esa red.

---

### 💻 Fragmentos de Código Clave (Implementación)

#### A. Carga e Integración de la API de Red (`src/App.svelte`)
Identifica el endpoint configurado para la red activa y realiza la consulta parametrizada para procesar y listar el historial de forma asíncrona:

```javascript
async function loadExplorerHistory() {
  if (!address || !chainId || chainId === "utxo") return;
  
  // Extrae la URL de la API asignada para la red activa en networks.js
  const apiUrl = getExplorerApiUrl(chainId);
  if (!apiUrl) {
    explorerHistory = [];
    return;
  }
  
  historyLoading = true;
  try {
    const response = await fetchWithRetry(
      `${apiUrl}?module=account&action=txlist&address=${address}&sort=desc`
    );
    const payload = await response.json();
    const rows = payload?.result || [];
    const ticker = getNetworkTicker(chainId);
    
    // Mapea y clasifica las transferencias del usuario (recibidas o enviadas)
    explorerHistory = rows
      .filter((tx) => tx.hash)
      .map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: ethers.formatEther(tx.value || "0"),
        type: String(tx.to || "").toLowerCase() === address.toLowerCase()
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
    console.error("No se pudo cargar el historial del explorador:", err);
    explorerHistory = [];
  } finally {
    historyLoading = false;
  }
}
```

#### B. Componente Visual del Historial de Actividad (`src/lib/Wallet.svelte`)
Muestra el historial renderizando estados de carga dinámicos y asigna un botón interactivo directo para auditar la transacción en la Web3:

```html
{#if historyLoading}
    <div class="flex flex-col gap-4 animate-pulse">
        {#each Array(3) as _}
            <div class="h-24 bg-white/5 rounded-2xl border border-white/5"></div>
        {/each}
    </div>
{:else if history.length > 0}
    {#each history as tx}
        <a href="{tx.explorerBase}{tx.hash}" target="_blank" class="bg-black/60 border border-anti-border p-5 rounded-2xl flex items-center justify-between group hover:border-anti-accent transition-all cursor-pointer">
            <div class="flex items-center gap-5">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center 
                    {tx.type === 'Received' ? 'bg-green-500/10 text-green-500' : 'bg-anti-accent/10 text-anti-accent'}">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d={tx.type === 'Received' ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'}/>
                    </svg>
                </div>
                <div>
                    <div class="text-xs font-black text-white uppercase tracking-widest">{tx.type}</div>
                    <div class="text-[10px] text-white/40 font-mono">{new Date(tx.timestamp).toLocaleString()}</div>
                </div>
            </div>
            <div class="flex items-center gap-6">
                <div class="text-right">
                    <div class="text-lg font-black font-cinzel {tx.type === 'Received' ? 'text-green-500' : 'text-white'}">
                        {tx.type === 'Received' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)}
                    </div>
                    <div class="text-[10px] text-white/40 font-black uppercase">{tx.assetSymbol}</div>
                </div>
            </div>
        </a>
    {/each}
{/if}
```

---

### 🕹️ Guía de Demostración (Prueba del Punto 2)
1. Conéctate a **Syscoin NEVM Testnet**. Envía o recibe un saldo de prueba (tSYS).
2. Abre la pestaña Dashboard y comprueba que las transacciones se listen bajo la denominación de **tSYS** y muestren los montos correspondientes.
3. Cambia la red a **Sepolia Testnet** en tu menú superior.
4. **Verificación:** Observa cómo el terminal se limpia de inmediato y ejecuta una llamada a la API de Etherscan Sepolia para renderizar en su lugar tu historial de **Sepolia ETH**, modificando dinámicamente los tickers, los enlaces y los balances en tiempo real.

---
---

# 📜 ACTIVIDAD 3: Transacciones de Contrato a Cuenta (Smart Contract Interaction)

### Descripción General
Se implementó un módulo avanzado de interacción con Smart Contracts. Permite ejecutar transferencias de tokens ERC-20 (`Contract to Account`) interactuando directamente con el ABI del contrato desplegado:
1. **Instanciación Ethers.js v6:** Conecta la interfaz del usuario con la dirección del token cargado y el ABI correspondiente usando el `signer` de la wallet activa.
2. **Captura del Hash:** Tras la firma del usuario, la DApp intercepta y congela el hash Hash hexadecimal asignado a la transacción.
3. **Receipt Visual Directo:** Muestra una tarjeta de confirmación del envío vinculada mediante el explorador correspondiente para facilitar la validación pública de la transacción.

---

### 💻 Fragmentos de Código Clave (Implementación)

#### A. Lógica de Envío de Token de Contrato (`src/lib/Wallet.svelte`)
Código de instanciación del contrato ERC-20 e invocación a la función nativa `transfer(address,uint256)`:

```javascript
async function sendTx() {
    error = ''; txHash = ''; txStatus = 'idle';
    if (!signer) { error = 'Billetera no detectada'; return; }

    const addrValidation = isValidChecksumAddress(toAddress);
    if (!addrValidation.valid) { error = 'Dirección de destino inválida'; return; }

    try {
        loading = true;
        txStatus = 'pending';
        
        let tx;
        if (transferType === 'native') {
            // Envío nativo estándar
            tx = await signer.sendTransaction({ 
                to: toAddress, 
                value: ethers.parseEther(amount.toString()) 
            });
        } else {
            // Envío por Contrato Inteligente ERC-20
            const contract = new ethers.Contract(
                contractAddress, 
                [
                    "function transfer(address to, uint256 amount) public returns (bool)", 
                    "function symbol() view returns (string)"
                ], 
                signer
            );
            
            let symbol = 'TOKEN';
            try { symbol = await contract.symbol(); } catch(e) {}
            
            // Llama a la transacción sobre el contrato inteligente
            tx = await contract.transfer(toAddress, ethers.parseUnits(amount.toString(), 18));
            contractTokenName = symbol;
        }

        // CAPTURA DEL HASH HEXADECIMAL DE LA TRANSACCIÓN
        txHash = tx.hash;
        txStatus = 'sent';
        
        // Espera de confirmación en el bloque
        await tx.wait(1); 
        txStatus = 'confirmed';
        
        // Limpieza de estados
        amount = ''; toAddress = '';
    } catch (err) {
        error = parseTransactionError(err);
        txStatus = 'error';
    } finally {
        loading = false;
    }
}
```

#### B. Interfaz del Hash de Transacción Exitosa (`src/lib/Wallet.svelte`)
Renderiza una tarjeta de confirmación con el Hash acortado y un botón interactivo directo al explorador de bloques:

```html
{#if txHash}
    <div class="p-5 bg-green-900/10 border border-green-500/30 rounded-2xl flex items-center justify-between" transition:slide>
        <div>
            <span class="block text-[10px] font-black text-green-500 uppercase">Transacción Exitosa</span>
            <span class="text-[9px] text-white/40 font-mono">{txHash.slice(0, 20)}...</span>
        </div>
        <a href="{getExplorerBase(chainId)}{txHash}" target="_blank" class="px-5 py-2.5 bg-green-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Ver Detalle</a>
    </div>
{/if}
```

---

### 🕹️ Guía de Demostración (Prueba del Punto 3)
1. Ve al panel de **Transferencia** y cambia la opción superior del interruptor a **CONTRATO**.
2. Pega la dirección de tu contrato ERC-20 desplegado en la red activa (puedes usar el token de tu contrato **FERNANDODEV**).
3. Introduce la dirección de destino del receptor y un monto de tokens a enviar.
4. Pulsa **EJECUTAR TRANSACCIÓN** y firma la transacción en tu wallet.
5. **Verificación:** Al momento de la firma, se capturará e inyectará de forma reactiva el Hash de la transacción en la tarjeta verde de confirmación. Haz clic en **Ver Detalle** para auditar en vivo la transferencia del contrato al receptor en el explorador de la Blockchain.

---
---

# 📹 GUÍA DE GRABACIÓN DE VIDEO EXPLICATIVO (YOUTUBE)

Para tu exposición, se recomienda seguir el siguiente guion de demostración dinámica para asegurar la máxima calificación:

### ⏱️ Cronograma de Exposición Sugerido

1. **0:00 - 0:45 | Presentación e Introducción**
   - Muestra tu DApp, menciona tu nombre, el nombre de la organización de **Valle Grande** y el identificador de tu DApp (`AS232S6_##_nameDApp`).
   - Muestra brevemente tu editor de código para evidenciar que estás en la rama `develop`.

2. **0:45 - 2:00 | Demostración del Punto 1 (Cambio de Red y Autoagregado)**
   - Abre MetaMask, elimina manualmente una red configurada (ej. Syscoin NEVM Testnet).
   - Ve a la DApp y haz clic en cambiar a esa red. Explica cómo la aplicación intercepta el error nativo `4902` y genera la solicitud automática para reconfigurar la red en MetaMask sin escribir ningún parámetro de forma manual.
   - Demuestra la función de "Retirar Red", ocultando una red de prueba y volviéndola a vincular desde el filtro de "Eliminadas".

3. **2:00 - 3:15 | Demostración del Punto 2 (Historial de Transacciones por Red)**
   - Muestra tu cuenta en la red de pruebas Sepolia. Explica que la lista dinámica consulta la API de Etherscan Sepolia para listar tus transacciones.
   - Realiza un cambio de red a Rollux Testnet. Explica cómo la DApp refresca el historial de manera automática cambiando el origen de la API a Blockscout Rollux y actualizando los tickers a `tSYS` de manera reactiva.

4. **3:15 - 5:00 | Demostración del Punto 3 (Transacciones por Contrato y Captura de Hash)**
   - Ve a la sección de transferencias por Contrato.
   - Pega tu contrato de Token ERC-20 y realiza un envío de tokens a otra billetera.
   - Firma la transacción. En cuanto se concrete, señala la tarjeta verde indicando la captura dinámica del Hash hexadecimal.
   - Haz clic en **Ver Detalle** para mostrar en vivo la transacción exitosa en el explorador público.
