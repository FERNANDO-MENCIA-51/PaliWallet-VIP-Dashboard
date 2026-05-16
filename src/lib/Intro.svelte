<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    export let onConnect = () => {};
    export let loading = false;

    onMount(() => {
        const win = /** @type {any} */ (window);
        if (win.anime) {
            win.anime({
                targets: '.stagger-box',
                translateY: [30, 0],
                opacity: [0, 1],
                delay: win.anime.stagger(150),
                easing: 'easeOutExpo',
                duration: 1500
            });
        }
    });

    const features = [
        {
            title: "Seguridad de Vanguardia",
            desc: "Protocolos de cifrado avanzado y conexión directa con hardware wallets para máxima protección.",
            icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        },
        {
            title: "Ecosistema Multi-Red",
            desc: "Accede a las principales redes EVM del mercado: Syscoin, Rollux, Ethereum y BSC desde un solo lugar.",
            icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        },
        {
            title: "Transacciones Instantáneas",
            desc: "Ejecución de transferencias P2P con confirmación en tiempo real y comisiones optimizadas.",
            icon: "M13 10V3L4 14h7v7l9-11h-7z"
        }
    ];
</script>

<div class="flex flex-col gap-24 py-10" in:fade>
    <!-- Hero Landing -->
    <header class="relative flex flex-col items-center text-center gap-8 max-w-4xl mx-auto px-4">
        <div class="stagger-box inline-block px-4 py-1.5 rounded-full border border-anti-accent/30 bg-anti-accent/5 text-anti-accent text-[10px] font-black tracking-[0.5em] uppercase">
            Sistema de Gestión Financiera
        </div>
        
        <h1 class="stagger-box font-cinzel text-6xl md:text-8xl font-black text-white leading-tight">
            TU FUTURO <br/>
            <span class="text-anti-accent drop-shadow-[0_0_25px_rgba(230,0,0,0.5)]">SIN LÍMITES</span>
        </h1>

        <p class="stagger-box text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-sans">
            Fernando Dev Terminal es la plataforma definitiva para la gestión de activos digitales. Operaciones transparentes, seguras y sin intermediarios.
        </p>

        <div class="stagger-box flex gap-4 mt-4">
            <button 
                on:click={onConnect}
                disabled={loading}
                class="px-10 py-4 bg-white text-black font-black font-cinzel text-lg rounded-xl hover:bg-anti-accent hover:text-white transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl"
            >
                {loading ? 'CONECTANDO...' : 'INICIAR DASHBOARD'}
            </button>
        </div>
    </header>

    <!-- Features Grid -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each features as feature}
            <div class="stagger-box group p-8 bg-anti-surface border border-anti-border rounded-3xl hover:border-anti-accent transition-all duration-500 hover:-translate-y-2">
                <div class="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:bg-anti-accent transition-colors duration-500">
                    <svg class="w-7 h-7 text-anti-accent group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon}/></svg>
                </div>
                <h3 class="font-cinzel text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p class="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
        {/each}
    </section>

    <!-- How it works -->
    <section class="stagger-box bg-anti-surface border border-anti-border rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
        <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <h2 class="font-cinzel text-4xl font-black text-white mb-8">GESTIÓN <span class="text-anti-accent">PROFESIONAL</span></h2>
                <div class="space-y-8">
                    <div class="flex gap-6">
                        <div class="shrink-0 w-10 h-10 rounded-full bg-anti-accent flex items-center justify-center font-black">1</div>
                        <div>
                            <h4 class="text-white font-bold mb-1">Conexión Segura</h4>
                            <p class="text-gray-400 text-sm">Vincula tu Pali Wallet con un solo clic. Tu seguridad es nuestra prioridad.</p>
                        </div>
                    </div>
                    <div class="flex gap-6">
                        <div class="shrink-0 w-10 h-10 rounded-full bg-anti-border border border-anti-accent flex items-center justify-center font-black">2</div>
                        <div>
                            <h4 class="text-white font-bold mb-1">Análisis de Cartera</h4>
                            <p class="text-gray-400 text-sm">Visualiza tus activos en tiempo real a través de múltiples redes y protocolos.</p>
                        </div>
                    </div>
                    <div class="flex gap-6">
                        <div class="shrink-0 w-10 h-10 rounded-full bg-anti-border border border-anti-accent flex items-center justify-center font-black">3</div>
                        <div>
                            <h4 class="text-white font-bold mb-1">Ejecución Directa</h4>
                            <p class="text-gray-400 text-sm">Envía y recibe activos con la mayor eficiencia del mercado blockchain.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="aspect-square bg-black rounded-full border border-anti-accent/20 flex items-center justify-center relative">
                 <div class="absolute inset-0 bg-anti-accent/5 rounded-full animate-pulse"></div>
                 <div class="text-center">
                     <span class="block font-cinzel text-8xl text-white font-black uppercase">DEV</span>
                     <span class="block text-anti-accent font-black tracking-widest uppercase">Fernando</span>
                 </div>
            </div>
        </div>
    </section>

    <!-- Author Quote -->
    <section class="stagger-box flex flex-col items-center text-center gap-6 py-20">
        <div class="w-16 h-16 rounded-full bg-gray-900 border border-anti-accent p-1">
             <div class="w-full h-full rounded-full bg-anti-accent/20 flex items-center justify-center font-cinzel font-black">F</div>
        </div>
        <blockquote class="text-3xl font-cinzel text-white max-w-3xl italic">
            "La innovación constante es la única forma de alcanzar la libertad financiera en la era digital."
        </blockquote>
        <cite class="text-anti-accent font-bold tracking-widest uppercase">Fernando Dev // Lead Architect</cite>
    </section>
</div>
