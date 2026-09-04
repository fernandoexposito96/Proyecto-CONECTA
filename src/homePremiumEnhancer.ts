export {};

const navTo = (label: string) => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const match = buttons.find((button) => button.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
  match?.click();
};

const clickFirst = (selector: string) => document.querySelector<HTMLButtonElement>(selector)?.click();

const heroImage = "https://images.unsplash.com/photo-1744943776635-04bdcc859692?auto=format&fit=crop&fm=jpg&q=82&w=1800";
const images = {
  popular: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=700&q=86",
  novelty: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=700&q=86",
  outdoor: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=700&q=86",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=86",
  culture: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=700&q=86",
  brunch: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=88",
  padel: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=88",
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=88",
  avatar1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=86",
  avatar2: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=86",
  avatar3: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=180&q=86",
  avatar4: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=180&q=86",
};

const icon = (name: string) => {
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths: Record<string, string> = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M8 14h3M8 17h5"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-3-1.4-5.4-4-8-.4 2-1.5 3.3-3 4-1-3-3-5-5-7 0 4-2 6-2 10 0 4.4 3.1 8 7 8Z"/><path d="M12 19c1.7 0 3-1.3 3-3 0-1.1-.5-2.1-1.4-3.1-.3 1-.9 1.7-1.6 2.1-.5-1.2-1.2-2.3-2.2-3.3-.1 1.8-.8 2.7-.8 4.3 0 1.7 1.3 3 3 3Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bag: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2M8 11v5M16 11v5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  };
  return `<svg ${common}>${paths[name] ?? paths.cal}</svg>`;
};

function createPremiumHome() {
  const root = document.createElement("div");
  root.className = "premium-home-root premium-home-v3";
  root.innerHTML = `
    <section class="ph-header">
      <button class="ph-icon-btn" data-action="menu" aria-label="Abrir menú">${icon("menu")}</button>
      <div class="ph-brand"><span>C</span><strong>CONECTA</strong></div>
      <button class="ph-icon-btn ph-bell" data-action="bell" aria-label="Notificaciones">${icon("bell")}<i></i></button>
    </section>

    <section class="ph-hero">
      <div class="ph-hero-copy">
        <p>¡Buenos días, Fernando! 👋</p>
        <h1>Descubre planes<br/>cerca de ti</h1>
        <b></b>
        <span class="ph-hero-sub">Conecta con personas increíbles<br/>y vive experiencias únicas</span>
        <div class="ph-hero-pills">
          <button data-nav="Mapa"><span class="pill-icon pin">${icon("pin")}</span><strong>Tarragona, España</strong><em>⌄</em></button>
          <button data-nav="Ahora"><span class="pill-icon sun">${icon("sun")}</span><strong>Hoy</strong><span>· Buen momento</span><em>⌄</em></button>
        </div>
      </div>
      <div class="ph-hero-photo"><img src="${heroImage}" alt="Grupo de amigos viendo el atardecer junto al mar"/></div>
    </section>

    <section class="ph-map-card">
      <iframe title="Mapa de Tarragona" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=1.10%2C41.02%2C1.36%2C41.22&layer=mapnik&marker=41.1189%2C1.2445"></iframe>
      <span class="ph-pin ph-p1">12</span><span class="ph-pin ph-p2">8</span><span class="ph-pin ph-p3">5</span>
      <button class="ph-location" data-nav="Mapa" aria-label="Abrir mapa">${icon("locate")}</button>
    </section>

    <section class="ph-quick-row">
      <button data-nav="Ahora"><i class="qi purple">${icon("cal")}</i><strong>Ahora</strong><small>Qué hay cerca</small></button>
      <button data-nav="Planes"><i class="qi orange">${icon("fire")}</i><strong>Hoy</strong><small>Planes para hoy</small></button>
      <button data-nav="Calendario"><i class="qi green">${icon("cal")}</i><strong>Fin de semana</strong><small>Escapadas</small></button>
      <button data-nav="Grupos"><i class="qi blue">${icon("users")}</i><strong>Grupos</strong><small>Únete a uno</small></button>
      <button data-nav="Explorar"><i class="qi pink">${icon("bag")}</i><strong>Viajes</strong><small>Próximos</small></button>
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
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.brunch}')"><span class="popular">POPULAR</span><button aria-label="Guardar plan">${icon("heart")}</button><em>75%<small>compatible</small></em></div><div class="ph-plan-body"><h3>Brunch y conversación</h3><p>${icon("pin")} Plaça de la Font, Tarragona</p><small>${icon("cal")} Vie · 4 Sept, 12:30</small><div><b>A</b><span>1 persona</span><span>9 plazas</span><span>18,00 €</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.padel}')"><span>NOVEDAD</span><button aria-label="Guardar plan">${icon("heart")}</button></div><div class="ph-plan-body"><h3>Pádel sunset</h3><p>${icon("pin")} Club Pádel Tarragona</p><small>${icon("cal")} Hoy, 19:30</small><div><b>B</b><span>4 personas</span><span>6 plazas</span><span>Gratis</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
        <article class="ph-plan"><div class="ph-plan-img" style="--img:url('${images.hiking}')"><span class="green">AIRE LIBRE</span><button aria-label="Guardar plan">${icon("heart")}</button></div><div class="ph-plan-body"><h3>Tarde de senderismo</h3><p>${icon("pin")} La Mussara, Prades</p><small>${icon("cal")} Sáb · 6 Sept, 10:00</small><div><b>A</b><span>6 personas</span><span>10 plazas</span><span>Gratis</span></div><button data-nav="Planes">✓ Voy a asistir</button></div></article>
      </div>
    </section>

    <section class="ph-compat" data-nav="Explorar">
      <div class="ph-compat-copy"><span>PERSONAS PARA TUS PLANES</span><h2>Compatibilidad real</h2><p>Conecta con personas afines a ti.</p></div>
      <div class="ph-avatars"><img src="${images.avatar1}" alt=""/><img src="${images.avatar2}" alt=""/><img src="${images.avatar3}" alt=""/><img src="${images.avatar4}" alt=""/><b>+12</b></div>
      <strong>75%<small>compatible</small></strong><i>›</i>
    </section>
  `;

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-nav],[data-action]");
    if (!target) return;
    if (target.dataset.nav) navTo(target.dataset.nav);
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
