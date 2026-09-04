export {};

const normalize = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("es");

const clickExactButton = (selector: string, label: string) => {
  const wanted = normalize(label);
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(selector));
  const exact = buttons.find((button) => normalize(button.textContent) === wanted);
  if (exact) {
    exact.click();
    return true;
  }
  return false;
};

const navTo = (label: string) => {
  const aliases: Record<string, string> = {
    Conectar: "Conecta+",
    Viajes: "Explorar",
    Categorías: "Explorar",
  };
  const target = aliases[label] ?? label;

  const mobileMap: Record<string, string> = {
    Inicio: "Inicio",
    Explorar: "Explorar",
    "Conecta+": "Conectar",
    Chat: "Chat",
  };

  const mobileLabel = mobileMap[target];
  if (mobileLabel && clickExactButton(".bottom-nav button", mobileLabel)) return;
  if (clickExactButton(".side-nav button", target)) return;
  if (clickExactButton(".mobile-menu-list button", target)) return;

  // Fallback controlado para vistas no presentes en navegación móvil.
  const candidates = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".sidebar button, .topbar button, .content-wrap button"),
  );
  const match = candidates.find((button) => normalize(button.textContent) === normalize(target));
  match?.click();
};

const openMenu = () =>
  document.querySelector<HTMLButtonElement>(".topbar .mobile-menu-button")?.click();

const openNotifications = () =>
  document.querySelector<HTMLButtonElement>('.topbar button[aria-label="Notificaciones"]')?.click();

const heroImage =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&fm=jpg&q=92&w=1800";

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
  const common =
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths: Record<string, string> = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M8 14h3M8 17h5"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-3-1.4-5.4-4-8-.4 2-1.5 3.3-3 4-1-3-3-5-5-7 0 4-2 6-2 10 0 4.4 3.1 8 7 8Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    bag: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
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
      <button class="ph-brand" data-nav="Inicio" aria-label="Ir a Inicio"><span>C</span><strong>CONECTA</strong></button>
      <button class="ph-icon-btn ph-bell" data-action="bell" aria-label="Notificaciones">${icon("bell")}<i></i></button>
    </section>

    <section class="ph-hero ph-hero-photo-only">
      <div class="ph-hero-copy">
        <p>¡Buenos días, Fernando! 👋</p>
        <h1>Descubre planes<br/>cerca de ti</h1>
        <b></b>
        <span class="ph-hero-sub">Conecta con personas increíbles<br/>y vive experiencias únicas</span>
      </div>
      <div class="ph-hero-photo"><img src="${heroImage}" alt="Grupo de amigos pasándolo bien juntos"/></div>
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
        <article class="ph-plan" data-nav="Planes"><div class="ph-plan-img" style="--img:url('${images.brunch}')"><span class="popular">POPULAR</span><button data-nav="Planes" aria-label="Abrir plan para guardarlo">${icon("heart")}</button><em>75%<small>compatible</small></em></div><div class="ph-plan-body"><h3>Brunch y conversación</h3><p>${icon("pin")} Plaça de la Font, Tarragona</p><small>${icon("cal")} Vie · 4 Sept, 12:30</small><div><b>A</b><span>1 persona</span><span>9 plazas</span><span>18,00 €</span></div><button data-nav="Planes">Ver plan</button></div></article>
        <article class="ph-plan" data-nav="Planes"><div class="ph-plan-img" style="--img:url('${images.padel}')"><span>NOVEDAD</span><button data-nav="Planes" aria-label="Abrir plan para guardarlo">${icon("heart")}</button></div><div class="ph-plan-body"><h3>Pádel sunset</h3><p>${icon("pin")} Club Pádel Tarragona</p><small>${icon("cal")} Hoy, 19:30</small><div><b>B</b><span>4 personas</span><span>6 plazas</span><span>Gratis</span></div><button data-nav="Planes">Ver plan</button></div></article>
        <article class="ph-plan" data-nav="Planes"><div class="ph-plan-img" style="--img:url('${images.hiking}')"><span class="green">AIRE LIBRE</span><button data-nav="Planes" aria-label="Abrir plan para guardarlo">${icon("heart")}</button></div><div class="ph-plan-body"><h3>Tarde de senderismo</h3><p>${icon("pin")} La Mussara, Prades</p><small>${icon("cal")} Sáb · 6 Sept, 10:00</small><div><b>A</b><span>6 personas</span><span>10 plazas</span><span>Gratis</span></div><button data-nav="Planes">Ver plan</button></div></article>
      </div>
    </section>

    <button class="ph-compat" data-nav="Explorar" type="button">
      <div class="ph-compat-copy"><span>PERSONAS PARA TUS PLANES</span><h2>Compatibilidad real</h2><p>Conecta con personas afines a ti.</p></div>
      <div class="ph-avatars"><img src="${images.avatar1}" alt=""/><img src="${images.avatar2}" alt=""/><img src="${images.avatar3}" alt=""/><img src="${images.avatar4}" alt=""/><b>+12</b></div>
      <strong>75%<small>compatible</small></strong><i>›</i>
    </button>
  `;

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-nav],[data-action]");
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    if (target.dataset.action === "menu") return openMenu();
    if (target.dataset.action === "bell") return openNotifications();
    if (target.dataset.nav) navTo(target.dataset.nav);
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
  requestAnimationFrame(() => {
    queued = false;
    syncPremiumHome();
  });
};

const observer = new MutationObserver(queueSync);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueSync);
window.addEventListener("pageshow", queueSync);
queueSync();
