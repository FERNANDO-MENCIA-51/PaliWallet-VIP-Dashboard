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
    <!-- Hero Section -->
    <header class="hero stagger-card">
        <div class="hero-content">
            <div class="hero-badge cinzel">BLACK-CORE PROTOCOL</div>
            <h1 class="cinzel hero-title">Tu Terminal de<br/><span>Operaciones Blockchain</span></h1>
            <p class="hero-desc">Gestión de activos digitales de alto rendimiento. Conexión directa con Pali Wallet para operar en múltiples redes EVM con seguridad y velocidad.</p>
        </div>
        <div class="hero-clover">
            <svg viewBox="0 0 200 200" class="hero-clover-svg">
                <path d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" fill="var(--accent)" opacity="0.2"/>
                <path d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" fill="var(--accent)" opacity="0.2"/>
                <path d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" fill="var(--accent)" opacity="0.2"/>
                <path d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" fill="var(--accent)" opacity="0.2"/>
                <path d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" fill="var(--accent)" opacity="0.15"/>
            </svg>
        </div>
    </header>

    <div class="grid-layout">
        <!-- Profile Column -->
        <aside class="profile-col stagger-card">
            <div class="author-card">
                <div class="author-frame">
                    <!-- Marco estilo Asta Transformation -->
                    <div class="frame-border"></div>
                    <div class="frame-glow"></div>
                    <div class="author-avatar">
                        <svg viewBox="0 0 100 100" class="avatar-placeholder">
                            <circle cx="50" cy="35" r="18" fill="#333" stroke="var(--accent)" stroke-width="1"/>
                            <ellipse cx="50" cy="80" rx="28" ry="20" fill="#333" stroke="var(--accent)" stroke-width="1"/>
                        </svg>
                    </div>
                    <div class="frame-clover">
                        <svg viewBox="0 0 200 200" width="24" height="24">
                            <path d="M100 100 Q100 55 85 40 Q70 25 55 40 Q40 55 55 70 Q70 85 100 100" fill="var(--accent)"/>
                            <path d="M100 100 Q145 100 160 85 Q175 70 160 55 Q145 40 130 55 Q115 70 100 100" fill="var(--accent)"/>
                            <path d="M100 100 Q55 100 40 115 Q25 130 40 145 Q55 160 70 145 Q85 130 100 100" fill="var(--accent)"/>
                            <path d="M100 100 Q100 145 115 160 Q130 175 145 160 Q160 145 145 130 Q130 115 100 100" fill="var(--accent)"/>
                            <path d="M100 100 Q130 70 150 55 Q165 45 155 30 Q140 20 125 35 Q110 50 100 100" fill="var(--accent)"/>
                        </svg>
                    </div>
                </div>
                <div class="author-info">
                    <h3 class="cinzel">Fernando</h3>
                    <p class="author-role">Arquitecto & Operador Blockchain</p>
                    <div class="author-tags">
                        <span>Protocolo EVM</span>
                        <span>Svelte Core</span>
                        <span>DApp Developer</span>
                    </div>
                </div>
            </div>

            <!-- Stats rápidos -->
            <div class="quick-stats stagger-card">
                <div class="qs-item">
                    <span class="qs-value cinzel">5+</span>
                    <span class="qs-label">Redes Soportadas</span>
                </div>
                <div class="qs-item">
                    <span class="qs-value cinzel">P2P</span>
                    <span class="qs-label">Transferencias</span>
                </div>
                <div class="qs-item">
                    <span class="qs-value cinzel">EVM</span>
                    <span class="qs-label">Compatible</span>
                </div>
            </div>
        </aside>

        <!-- Content Column -->
        <main class="content-col">
            <div class="info-grid">
                <section class="info-card stagger-card gold-border">
                    <div class="card-head">
                        <span class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </span>
                        <h4 class="cinzel">¿Qué es Black-Core?</h4>
                    </div>
                    <p>Una DApp de alto rendimiento diseñada para la gestión de activos digitales. Conexión directa y segura con Pali Wallet, garantizando que tus operaciones blockchain se ejecuten con precisión y velocidad.</p>
                </section>

                <section class="info-card stagger-card silver-border">
                    <div class="card-head">
                        <span class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        </span>
                        <h4 class="cinzel">Protocolos de Red</h4>
                    </div>
                    <ul class="mission-list">
                        <li>Interconexión entre Capas (Multi-Red EVM).</li>
                        <li>Transferencias instantáneas P2P.</li>
                        <li>Registro inmutable en el Ledger.</li>
                        <li>Sincronización directa con Pali Wallet.</li>
                    </ul>
                </section>

                <section class="info-card stagger-card gold-border">
                    <div class="card-head">
                        <span class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </span>
                        <h4 class="cinzel">Características Clave</h4>
                    </div>
                    <div class="attr-tags">
                        <span>Pali Wallet Sync</span>
                        <span>Multi-Chain EVM</span>
                        <span>Transferencias P2P</span>
                        <span>Historial On-Chain</span>
                        <span>Token Tracking</span>
                        <span>Gas Estimation</span>
                    </div>
                </section>

                <section class="info-card stagger-card silver-border">
                    <div class="card-head">
                        <span class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                        </span>
                        <h4 class="cinzel">Cómo Funciona</h4>
                    </div>
                    <div class="steps-grid">
                        <div class="step">
                            <span class="step-num cinzel">01</span>
                            <strong>Conexión</strong>
                            <span>Conecta tu Pali Wallet</span>
                        </div>
                        <div class="step">
                            <span class="step-num cinzel">02</span>
                            <strong>Selección</strong>
                            <span>Elige tu red EVM</span>
                        </div>
                        <div class="step">
                            <span class="step-num cinzel">03</span>
                            <strong>Transmisión</strong>
                            <span>Envía activos al instante</span>
                        </div>
                        <div class="step">
                            <span class="step-num cinzel">04</span>
                            <strong>Verificación</strong>
                            <span>Confirma en el Explorer</span>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Sección adicional: Redes soportadas -->
            <section class="networks-showcase stagger-card">
                <h3 class="cinzel">Redes Soportadas</h3>
                <div class="net-logos">
                    <div class="net-logo-item">
                        <div class="net-circle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </div>
                        <span>Syscoin NEVM</span>
                    </div>
                    <div class="net-logo-item">
                        <div class="net-circle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        </div>
                        <span>Rollux</span>
                    </div>
                    <div class="net-logo-item">
                        <div class="net-circle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                        </div>
                        <span>Ethereum</span>
                    </div>
                    <div class="net-logo-item">
                        <div class="net-circle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                        </div>
                        <span>BSC</span>
                    </div>
                </div>
            </section>
        </main>
    </div>
</div>

<style>
    .intro-pane {
        width: 100%;
        color: var(--text-primary);
    }

    /* ── Hero ── */
    .hero {
        position: relative;
        margin-bottom: 3rem;
        padding: 3rem 0;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        overflow: hidden;
    }

    .hero-badge {
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        color: var(--accent);
        border: 1px solid rgba(230,0,0,0.3);
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 1.5rem;
    }

    .hero-title {
        font-size: 2.8rem;
        margin: 0 0 1.5rem;
        color: #e0e0e0;
        line-height: 1.2;
    }

    .hero-title span {
        color: var(--accent);
    }

    .hero-desc {
        color: var(--text-secondary);
        font-size: 1.05rem;
        line-height: 1.7;
        max-width: 550px;
    }

    .hero-clover {
        flex-shrink: 0;
    }

    .hero-clover-svg {
        width: 200px;
        height: 200px;
        animation: hero-float 4s ease-in-out infinite;
    }

    @keyframes hero-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
    }

    @media (max-width: 768px) {
        .hero { flex-direction: column; text-align: center; }
        .hero-title { font-size: 2rem; }
        .hero-clover-svg { width: 120px; height: 120px; }
        .hero-desc { max-width: 100%; }
    }

    /* ── Grid Layout ── */
    .grid-layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 2.5rem;
    }

    @media (max-width: 1100px) {
        .grid-layout { grid-template-columns: 1fr; }
    }

    /* ── Author Card ── */
    .author-card {
        background: var(--surface);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    .author-frame {
        height: 180px;
        background: linear-gradient(135deg, #0a0000 0%, #000 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        border-bottom: 1px solid var(--border-color);
    }

    .frame-border {
        position: absolute;
        inset: 8px;
        border: 1px solid rgba(230, 0, 0, 0.2);
        border-radius: 4px;
        pointer-events: none;
    }

    .frame-glow {
        position: absolute;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(230,0,0,0.15) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    }

    .author-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid var(--accent);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #111;
        box-shadow: 0 0 20px rgba(230,0,0,0.3);
        z-index: 1;
    }

    .avatar-placeholder {
        width: 60px;
        height: 60px;
    }

    .frame-clover {
        position: absolute;
        bottom: 8px;
        right: 8px;
        opacity: 0.4;
    }

    .author-info {
        padding: 1.5rem;
        text-align: center;
    }

    .author-info h3 {
        font-size: 1.5rem;
        margin: 0 0 0.3rem;
        color: var(--accent);
    }

    .author-role {
        color: var(--accent-2);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.7rem;
        margin: 0 0 1.2rem;
    }

    .author-tags {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .author-tags span {
        background: var(--surface-soft);
        padding: 0.45rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8rem;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        text-align: center;
    }

    /* ── Quick Stats ── */
    .quick-stats {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }

    .qs-item {
        background: var(--surface);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem 0.5rem;
        text-align: center;
    }

    .qs-value {
        display: block;
        font-size: 1.1rem;
        color: var(--accent);
        margin-bottom: 0.3rem;
    }

    .qs-label {
        font-size: 0.6rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ── Info Cards ── */
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }

    @media (max-width: 800px) {
        .info-grid { grid-template-columns: 1fr; }
    }

    .info-card {
        background: var(--surface);
        border: 1px solid var(--border-color);
        padding: 1.8rem;
        border-radius: 10px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .info-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(230, 0, 0, 0.15);
        border-color: rgba(230, 0, 0, 0.3);
    }

    .gold-border { border-left: 3px solid var(--accent); }
    .silver-border { border-left: 3px solid var(--accent-2); }

    .card-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.2rem;
    }

    .card-icon {
        width: 36px;
        height: 36px;
        background: rgba(230,0,0,0.08);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .info-card h4 {
        margin: 0;
        font-size: 1.1rem;
        color: #e0e0e0;
    }

    .info-card p {
        color: var(--text-secondary);
        line-height: 1.75;
        margin: 0;
        font-size: 0.9rem;
    }

    .mission-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .mission-list li {
        color: var(--text-secondary);
        padding: 0.6rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        font-size: 0.88rem;
        padding-left: 1rem;
        position: relative;
    }

    .mission-list li::before {
        content: '▸';
        position: absolute;
        left: 0;
        color: var(--accent);
    }

    .mission-list li:last-child { border: none; }

    .attr-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
    }

    .attr-tags span {
        background: rgba(230,0,0,0.06);
        border: 1px solid rgba(230,0,0,0.2);
        color: var(--accent);
        padding: 0.35rem 0.7rem;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .steps-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .step {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .step-num {
        font-size: 1.2rem;
        color: var(--accent);
        opacity: 0.4;
    }

    .step strong {
        color: #ddd;
        font-size: 0.85rem;
    }

    .step span {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    /* ── Networks Showcase ── */
    .networks-showcase {
        margin-top: 2rem;
        background: var(--surface);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 2rem;
    }

    .networks-showcase h3 {
        font-size: 1rem;
        color: #ddd;
        margin: 0 0 1.5rem;
        letter-spacing: 0.05em;
    }

    .net-logos {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .net-logo-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
    }

    .net-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(230,0,0,0.06);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent);
    }
</style>
