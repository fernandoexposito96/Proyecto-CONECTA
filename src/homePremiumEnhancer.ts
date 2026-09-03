const navTo = (label: string) => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const match = buttons.find((button) => button.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
  match?.click();
};

const clickFirst = (selector: string) => {
  document.querySelector<HTMLButtonElement>(selector)?.click();
};

const heroImage = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=88";
const images = {
  popular: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=700&q=84",
  novelty: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=700&q=84",
  outdoor: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=700&q=84",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=84",
  culture: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=700&q=84",
  brunch: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=86",
  padel: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=86",
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=86",
  avatar1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=84",
  avatar2: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=84",
  avatar3: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=84",
  avatar4: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=84",
};

function createPremiumHome() {
  const root = document.createElement("div");
  root.className = "premium-home-root";
  root.innerHTML = `
    <section class="ph-header">
      <button class="ph-icon-btn" data-action="menu" aria-label="Abrir menú">☰</button>
      <div class="ph-brand"><span>C</span><strong>CONECTA</strong></div>
      <button class="ph-icon-btn ph-bell" data-action="bell" aria-label="Notificaciones">♢<i></i></button>
    </section>

    <section class="ph-hero">
      <div class="ph-hero-copy">
        <p>¡Buenos días, Fernando! 👋</p>
        <h1>Descubre planes<br/>cerca de ti</h1>
        <b></b>
        <div class="ph-hero-pills">
          <button data-nav="Mapa">⌖ <strong>Tarragona, España</strong>⌄</button>
          <button data-nav="Ahora">☀ <strong>Hoy</strong> · Buen momento para salir</button>
        </div>
      </div>
      <img src="${heroImage}" alt="Amigos disfrutando de un plan juntos"/>
    </section>

    <section class="ph-map-card">
      <iframe title="Mapa de Tarragona" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=1.10%2C41.02%2C1.36%2C41.22&layer=mapnik&marker=41.1189%2C1.2445"></iframe>
      <span class="ph-pin ph-p1">8</span><span class="ph-pin ph-p2">12</span><span class="ph-pin ph-p3">5</span>
      <button class="ph-location" data-nav="Mapa" aria-label="Abrir mapa">⌾</button>
    </section>

    <section class="ph-quick-row">
      <button data-nav="Ahora"><i>▣</i><strong>Ahora</strong><small>Qué hay cerca</small></button>
      <button data-nav="Planes"><i>🔥</i><strong>Hoy</strong><small>Planes para hoy</small></button>
      <button data-nav="Calendario"><i>▤</i><strong>Fin de semana</strong><small>Escapadas</small></button>
      <button data-nav="Grupos"><i>♧</i><strong>Grupos</strong><small>Únete a uno</small></button>
      <button data-nav="Explorar"><i>▣</i><strong>Viajes</strong><small>Próximos</small></button>
    </section>

    <section class="ph-section ph-categories">
      <div class="ph-title-row"><div><span>ELIGE TU MOMENTO</span><h2>¿Qué te apetece hacer?</h2></div><button data-nav="Explorar">Todas las categorías ›</button></div>
      <div class="ph-category-scroll">
        <button data-nav="Explorar" style="--img:url('${images.popular}')"><b>Popular</b></button>
        <button data-nav="Explorar" style="--img:url('${images.novelty}')"><b>Novedad</b></button>
        <button data-nav="Explorar" style="--img:url('${images.outdoor}')"><b>Aire libre</b></button>
        <button data-nav="Explorar" style="--img:url('${images.food}')"><b>Gastronomía</b></button>
        <button data-nav="Explorar" style="--img:url('${images.culture}')"><b>Cultura</b></button>
      </div>
    </section>

    <section class="ph-section ph-plans">
      <div class="ph-title-row"><h2>Planes para ti</h2><button data-nav="Planes">Ver más ›</button></div>
      <div class="ph-plan-grid">
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.brunch}')"><span class="yellow">★ PRIMER PLAN</span><button>♡</button><em>75%<small>compatible</small></em></div><div class="ph-plan-body"><h3>Brunch y conversación</h3><p>⌖ Plaça de la Font, Tarragona</p><small>▣ Vie · 4 Sept, 12:37</small><div><b>A</b><span>1 persona</span><span>9 plazas</span><span>18,00 €</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.padel}')"><span>NOVEDAD</span><button>♡</button></div><div class="ph-plan-body"><h3>Pádel sunset</h3><p>⌖ Club Pádel Tarragona</p><small>▣ Hoy, 19:30</small><div><b>B</b><span>4 personas</span><span>6 plazas</span><span>Gratis</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.hiking}')"><span class="green">AIRE LIBRE</span><button>♡</button></div><div class="ph-plan-body"><h3>Tarde de senderismo</h3><p>⌖ La Mussara, Prades</p><small>▣ Sáb · 6 Sept, 10:00</small><div><b>A</b><span>6 personas</span><span>10 plazas</span><span>Gratis</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
      </div>
    </section>

    <section class="ph-compat" data-nav="Explorar">
      <div><span>PERSONAS PARA TUS PLANES</span><h2>Compatibilidad real</h2><p>Conecta con personas afines a ti.</p></div>
      <div class="ph-avatars"><img src="${images.avatar1}"/><img src="${images.avatar2}"/><img src="${images.avatar3}"/><img src="${images.avatar4}"/><b>+12</b></div>
      <strong>75%<small>compatible</small></strong><i>›</i>
    </section>
  `;

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-nav],[data-action]");
    if (!target) return;
    const nav = target.dataset.nav;
    if (nav) navTo(nav);
    if (target.dataset.action === "menu") clickFirst(".topbar button");
    if (target.dataset.action === "bell") clickFirst(".topbar [aria-label*='notific'], .topbar button:last-of-type");
  });
  return root;
}

function syncPremiumHome() {
  const main = document.querySelector<HTMLElement>(".main-content");
  const content = document.querySelector<HTMLElement>(".content-wrap");
  if (!main || !content) return;
  const isHome = Boolean(content.querySelector(":scope > .welcome-row"));
  const existing = main.querySelector<HTMLElement>(":scope > .premium-home-root");
  if (isHome) {
    main.classList.add("premium-home-active");
    if (!existing) content.before(createPremiumHome());
  } else {
    main.classList.remove("premium-home-active");
    existing?.remove();
  }
}

let queued = false;
const queueSync = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; syncPremiumHome(); });
};

const observer = new MutationObserver(queueSync);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueSync);
queueSync();
