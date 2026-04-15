<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    onMount(() => {
        const win = /** @type {any} */ (window);
        if (win.anime) {
            win.anime({
                targets: '.stagger-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: win.anime.stagger(100),
                easing: 'easeOutExpo',
                duration: 1200
            });
        }
    });
</script>

<div class="intro-pane" in:fade={{ duration: 400 }}>
    <div class="intro-header stagger-card">
        <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
        </div>
        <div>
            <h2 class="title">Proyecto de Innovacion Blockchain</h2>
            <p class="subtitle">DApp profesional para integracion multi red con Pali Wallet.</p>
        </div>
    </div>
    
    <div class="grid-layout">
        <!-- Developer Profile -->
        <div class="dev-card stagger-card">
            <div class="dev-bg"></div>
            <div class="dev-content">
                <div class="avatar-wrapper">
                    <img src="https://media.licdn.com/dms/image/v2/D5603AQEcyRLoEWMFxg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1683389066760?e=2147483647&v=beta&t=_3MKg47IBxg9k2A9H0xS7AHL0ePta86-Yiy3l59boGw" alt="Developer" class="avatar" />
                    <div class="avatar-ring"></div>
                </div>
                <h3>Fernando</h3>
                <p class="role">EVM Developer</p>
                <div class="dev-tags">
                    <span>Svelte</span>
                    <span>ethers.js</span>
                    <span>Blockchain</span>
                </div>
            </div>
        </div>

        <div class="info-layout">
            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">📝</span></div>
                <div>
                    <h4>1. Descripción</h4>
                    <p>DApp de alto rendimiento para gestionar transacciones seguras en redes EVM y UTXO compatibles. Integracion nativa con Pali Wallet para maxima seguridad.</p>
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">🎯</span></div>
                <div>
                    <h4>2. Objetivos</h4>
                    <ul>
                        <li>Interconexion robusta con nodos locales y remotos.</li>
                        <li>Ejecución de transacciones instantáneas P2P.</li>
                        <li>Gestion dinamica de redes en un solo clic.</li>
                        <li>Monitoreo claro del hash para detalle en exploradores.</li>
                    </ul>
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">✨</span></div>
                <div>
                    <h4>3. Beneficios</h4>
                    <p>Acceso a ecosistemas blockchain con una interfaz nivel VIP. Privacidad total, auditoria de transacciones por hash y soporte nativo para activos digitales.</p>
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">🚀</span></div>
                <div>
                    <h4>4. Características</h4>
                    <div class="feature-tags">
                        <span>Pali Wallet Sync</span>
                        <span>Multi-Red EVM</span>
                        <span>Transacciones P2P</span>
                        <span>Historial Persistente</span>
                    </div>
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">👨‍💻</span></div>
                <div class="dev-inline">
                    <div>
                        <h4>5. Desarrollador</h4>
                        <p>Perfil profesional con experiencia en EVM, UI avanzada y conexiones multi red.</p>
                    </div>
                    <img class="dev-mini" src="https://media.licdn.com/dms/image/v2/D5603AQEcyRLoEWMFxg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1683389066760?e=2147483647&v=beta&t=_3MKg47IBxg9k2A9H0xS7AHL0ePta86-Yiy3l59boGw" alt="Desarrollador" />
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">🧭</span></div>
                <div>
                    <h4>Alcance y Arquitectura</h4>
                    <ul>
                        <li>Frontend Svelte con layout VIP y paneles dinamicos.</li>
                        <li>Conectividad Pali Wallet para firmas seguras.</li>
                        <li>Gestor de redes UTXO + EVM con adicion automatica.</li>
                        <li>Historial local por cuenta y hash verificable.</li>
                    </ul>
                </div>
            </div>

            <div class="info-card stagger-card">
                <div class="icon-wrap"><span class="icon">📚</span></div>
                <div>
                    <h4>Documentacion Rapida</h4>
                    <div class="doc-grid">
                        <div>
                            <p class="doc-title">Conectar</p>
                            <p class="doc-text">Usa el boton de conectar, valida permisos y selecciona cuenta.</p>
                        </div>
                        <div>
                            <p class="doc-title">Cambiar red</p>
                            <p class="doc-text">Elige una red, si no existe se agrega automaticamente.</p>
                        </div>
                        <div>
                            <p class="doc-title">Transferir</p>
                            <p class="doc-text">Ingresa direccion, monto y confirma. Revisa el hash.</p>
                        </div>
                        <div>
                            <p class="doc-title">Ver detalle</p>
                            <p class="doc-text">Abre el explorer desde el historial o el status.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .intro-pane {
        width: 100%;
        text-align: left;
    }

    .intro-header {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        margin-bottom: 2.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
    }

    .header-icon {
        background: rgba(0, 208, 142, 0.1);
        padding: 0.8rem;
        border-radius: 14px;
        display: flex;
        border: 1px solid rgba(0, 208, 142, 0.2);
    }

    .title {
        font-family: 'Outfit', sans-serif;
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0;
        color: var(--platinum);
        letter-spacing: -0.02em;
        background: linear-gradient(to right, #ffffff, var(--accent));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .subtitle {
        margin: 0.35rem 0 0;
        font-size: 0.9rem;
        color: var(--muted);
    }

    .grid-layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 2rem;
    }

    @media (max-width: 1100px) {
        .grid-layout { grid-template-columns: 1fr; }
    }

    .dev-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border);
        border-radius: 24px;
        position: relative;
        overflow: hidden;
        text-align: center;
        padding: 0;
        display: flex;
        flex-direction: column;
    }

    .dev-bg {
        height: 120px;
        background: linear-gradient(to bottom, rgba(0, 208, 142, 0.15), transparent);
        border-bottom: 1px solid var(--border);
    }

    .dev-content {
        padding: 0 1.5rem 2rem;
        margin-top: -60px;
    }

    .avatar-wrapper {
        position: relative;
        display: inline-block;
        margin-bottom: 1.5rem;
    }

    .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: var(--bg-dark);
        border: 5px solid var(--bg-dark);
        position: relative;
        z-index: 2;
    }

    .avatar-ring {
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, var(--accent), transparent, var(--accent));
        animation: spin 4s linear infinite;
        z-index: 1;
        opacity: 0.6;
        filter: blur(4px);
    }

    .dev-content h3 {
        font-family: 'Outfit', sans-serif;
        margin: 0 0 0.3rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--platinum);
    }

    .role {
        font-size: 0.8rem;
        color: var(--accent);
        margin: 0 0 1.2rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .dev-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        justify-content: center;
    }

    .dev-tags span {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.4rem 0.8rem;
        font-size: 0.75rem;
        color: var(--muted);
        font-weight: 500;
    }

    .info-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.2rem;
    }

    .info-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .info-card:hover {
        background: rgba(0, 208, 142, 0.03);
        border-color: rgba(0, 208, 142, 0.3);
        transform: scale(1.01) translateY(-2px);
    }

    .icon-wrap {
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.4rem;
        border: 1px solid var(--border);
    }

    .info-card h4 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--platinum);
        font-family: 'Outfit', sans-serif;
    }

    .info-card p, .info-card ul {
        margin: 0;
        font-size: 0.95rem;
        color: var(--muted);
        line-height: 1.6;
    }

    .info-card ul {
        padding-left: 1.2rem;
        list-style: none;
    }

    .info-card ul li {
        margin-bottom: 0.4rem;
        position: relative;
    }

    .info-card ul li::before {
        content: '→';
        position: absolute;
        left: -1.2rem;
        color: var(--accent);
    }

    .feature-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.7rem;
        margin-top: 0.8rem;
    }

    .feature-tags span {
        background: rgba(0, 208, 142, 0.1);
        color: var(--accent);
        border: 1px solid rgba(0, 208, 142, 0.2);
        border-radius: 12px;
        padding: 0.4rem 0.9rem;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .doc-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 0.8rem;
    }

    .doc-title {
        margin: 0 0 0.2rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--platinum);
    }

    .doc-text {
        margin: 0;
        font-size: 0.85rem;
        color: var(--muted);
        line-height: 1.5;
    }

    @media (max-width: 900px) {
        .doc-grid {
            grid-template-columns: 1fr;
        }
    }

    .dev-inline {
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: space-between;
        width: 100%;
    }

    .dev-mini {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.03);
    }

    @keyframes spin { to { transform: rotate(360deg); } }
</style>
