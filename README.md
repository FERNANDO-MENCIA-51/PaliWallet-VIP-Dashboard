# 🔐 Pali Wallet · Demo Svelte + Blockchain

Demo en **Svelte + Vite** que conecta con **Pali Wallet** (inyectada como `window.ethereum`) usando **ethers** para:

- 🧩 Solicitar conexión de cuenta
- 👛 Mostrar **dirección** y **balance**
- 📋 Copiar address al portapapeles
- 🔌 Desconectar la sesión (UI)

---

## ✅ Requisitos

- 🧩 Extensión **Pali Wallet** instalada en tu navegador
- 🟢 Node.js (recomendado LTS)

---

## ▶️ Ejecutar el proyecto

En la carpeta del proyecto:

```bash
cd PaliWallet-VIP-Dashboard
npm install
npm run dev
```

Luego abre la URL que te muestre la terminal (por ejemplo `http://localhost:5173`).

---

## 🧠 ¿Cómo funciona?

### 1) Detección de la wallet

La app verifica si existe `window.ethereum`.  
Si no existe, muestra un error indicando que Pali Wallet no está instalada.

### 2) Conexión (login)

Cuando presionas **Iniciar sesión con Pali Wallet**:

- 🔐 Se solicitan permisos (si la wallet lo soporta) con `wallet_requestPermissions`
- 👤 Se solicita la cuenta con `eth_requestAccounts`
- 🧱 Se crea un provider con `ethers.BrowserProvider(window.ethereum)`
- ✍️ Se obtiene el signer y la dirección con `getSigner()` / `getAddress()`
- 💰 Se obtiene el balance con `getBalance(address)` y se formatea con `ethers.formatEther`

### 3) Copiar address

Al hacer click en el bloque de address:

- 📋 Se copia con `navigator.clipboard.writeText(address)`
- ✅ Se muestra un check temporal (2 segundos)

### 4) Desconectar

Al presionar **Desconectar**:

- 🧼 Se limpia `address`, `balance` y `connected` en la UI
- 🔓 Se intenta revocar permisos con `wallet_revokePermissions` (solo si la wallet lo soporta)

> Nota: algunas wallets recuerdan el permiso del sitio y pueden reconectar sin popup. En ese caso hay que quitar permisos desde la extensión.

---

## 🗂️ Estructura (principal)

- 📄 `src/App.svelte`: UI + lógica de conexión/copia/desconexión
- 🎨 `src/app.css`: estilos globales mínimos
- 🚀 `src/main.ts`: bootstrap de Svelte

---

## 🔧 Tecnologías

- ⚡ Svelte + Vite
- 🧠 TypeScript (en el entry)
- 🧰 ethers

# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
