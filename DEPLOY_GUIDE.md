# FERNANDODEV (FDEV) - Guía de Despliegue en Remix

Token ERC-20 personalizado con funciones de mint (emisión) y burn (quema) para el proyecto **FernandoDev VIP Dashboard**.

---

## Contrato Solidity

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title FernandoDevToken
 * @dev Token ERC-20 para FernandoDev VIP Dashboard con minting y burning
 */
contract FernandoDevToken is ERC20, Ownable, ERC20Burnable {
    
    uint8 private _decimals;
    
    /**
     * @dev Constructor que inicializa el token
     * @param name Nombre del token ("FERNANDODEV")
     * @param symbol Símbolo del token ("FDEV")
     * @param decimals_ Número de decimales (normalmente 18)
     * @param initialSupply Suministro inicial a mintear al propietario
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        
        // Emisión inicial al desplegador (owner)
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * (10 ** decimals_));
        }
    }
    
    /**
     * @dev Devuelve el número de decimales personalizado
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Emisión (Mint) de nuevos tokens. Solo ejecutable por el Propietario (owner).
     * @param to Dirección de destino
     * @param amount Cantidad a emitir (en unidades base del token)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Quema tokens del emisor
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) public virtual override {
        super.burn(amount);
    }
    
    /**
     * @dev Quema tokens de una dirección autorizada (con allowance)
     * @param account Dirección origen
     * @param amount Cantidad a quemar
     */
    function burnFrom(address account, uint256 amount) public virtual override {
        super.burnFrom(account, amount);
    }
}
```

---

## Paso a Paso para Remix

### 1. Abrir Remix IDE
- Ve a [Remix IDE](https://remix.ethereum.org/)
- Crea un nuevo archivo en el explorador de archivos llamado `FernandoDevToken.sol`
- Pega el código Solidity provisto arriba

### 2. Instalar OpenZeppelin
En Remix, las importaciones de `@openzeppelin/contracts` se resuelven automáticamente a través de internet siempre y cuando compile con Solidity Compiler.

### 3. Compilar el Contrato
- Selecciona el menú de **Solidity Compiler** (icono de compilador ▶️)
- Elige la versión de compilador `0.8.20` o superior (ej: `0.8.28`)
- Haz clic en **Compile FernandoDevToken.sol**
- Asegúrate de ver el indicador verde de éxito (✅)

### 4. Configurar el Entorno (Environment)
- Dirígete a **Deploy & Run Transactions** (icono del cohete 🚀)
- En **Environment**, selecciona:
  - `Injected Provider` (para desplegar en redes públicas de prueba como Sepolia, Syscoin Rollux Testnet, etc., usando tu wallet)
  - `Remix VM (Cancun)` (para pruebas locales instantáneas y aisladas)

### 5. Desplegar (Deploy)
Configura los parámetros del constructor en Remix antes de dar clic a desplegar:

| Parámetro | Valor Ejemplo | Descripción |
|-----------|---------------|-------------|
| `name` | "FERNANDODEV" | Nombre completo del Token |
| `symbol` | "FDEV" | Símbolo identificador |
| `decimals_` | 18 | Decimales estándar |
| `initialSupply` | 1000000 | Cantidad inicial (Ej: 1 millón) |

Haz clic en el botón naranja **Deploy** y firma la transacción en tu billetera.

### 6. Copiar Dirección del Contrato
- Una vez procesada la transacción, ve a la sección "Deployed Contracts" en la parte inferior izquierda.
- Haz clic en el icono de copiar dirección junto a `FernandoDevToken` para guardarlo en el portapapeles.

---

## Integración con FernandoDev VIP Dashboard

### 1. Guardar la Dirección en la App
- Abre tu DApp y navega a la pestaña de **Contratos**.
- En la primera tarjeta **FERNANDODEV**, pega la dirección copiada en el campo de texto.
- Haz clic en **💾 Guardar**. La app recordará automáticamente esta dirección incluso si recargas la página (utilizando persistencia en `localStorage`).

### 2. Comprobar Metadata Reactiva
El panel leerá inmediatamente los datos reales del contrato inteligente:
- ✅ Nombre de Token
- ✅ Símbolo
- ✅ Decimales y Suministro Total
- ✅ Balance de la cuenta conectada en tiempo real
- ✅ Funciones para realizar transferencias a otras cuentas

### 3. Panel de Administración (Mint/Burn)
Si tu cuenta es la propietaria del contrato desplegado:
- Ve a la tarjeta **Admin FERNANDODEV** a la derecha.
- Haz clic en el botón **Verificar si soy Owner**.
- Si la dirección conectada coincide con la dirección del propietario, se desbloquearán las funciones para realizar **Mint (Emisión)** y **Burn (Quema)** de tokens.

---

## Parámetros de Redes Soportadas

| Red | Chain ID | Explorador / Faucet |
|-----|----------|---------------------|
| zkTanenbaum Testnet | 57057 | [Syscoin Faucet](https://faucet.syscoin.org/) |
| Sepolia Testnet | 11155111 | [Sepolia Faucet](https://sepoliafaucet.com) |
| Localhost (Hardhat/Anvil) | 31337 | Entorno local de desarrollo |

> [!TIP]
> **Paleta de Colores en la DApp:**
> La interfaz del panel de contratos sigue estrictamente el diseño de la DApp:
> *   **Fondo de tarjetas:** Negro semi-translúcido (`bg-anti-surface` / `bg-black`)
> *   **Color de acento:** Rojo vibrante de la marca (`#e60000` / `text-anti-accent`) para bordes, sombras de botones y detalles de realce.
> *   **Sombras y destellos:** Micro-brillo radial en color rojo para una sensación Cyber-VIP Premium.
