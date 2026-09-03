export {};

const exploreCards = [
  {
    tone: "violet",
    eyebrow: "RUNNING",
    title: "Corre cuando te venga bien",
    text: "Planes por ritmo, distancia y hora para encontrar gente de tu nivel.",
    meta: "Hoy · 18:30",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=86",
  },
  {
    tone: "orange",
    eyebrow: "COMIDA",
    title: "Sitios para comer y conocer gente",
    text: "Brunch, tapas, cenas y mesas compartidas con ambiente social.",
    meta: "Desde 10 €",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=86",
  },
  {
    tone: "pink",
    eyebrow: "VALORACIONES",
    title: "Planes con buena reputación",
    text: "Destacamos experiencias con asistencia, organización y reseñas positivas.",
    meta: "4,8 ★ media",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c5?auto=format&fit=crop&w=900&q=86",
  },
];

const localCards = [
  {
    icon: "%",
    eyebrow: "OFERTAS PREMIUM",
    title: "Ventajas exclusivas cerca de ti",
    text: "Descuentos especiales en restaurantes, gimnasios, actividades y experiencias asociadas.",
    badge: "PREMIUM",
    premium: true,
    image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=86",
  },
  {
    icon: "🍴",
    eyebrow: "RESTAURANTES",
    title: "Restaurantes para quedar",
    text: "Descubre sitios por ambiente, precio, distancia y valoraciones.",
    badge: "TOP",
    premium: false,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=86",
  },
  {
    icon: "🏋️",
    eyebrow: "GIMNASIOS",
    title: "Gimnasios y clases",
    text: "Entrenos, clases grupales y compañeros para mantener la constancia.",
    badge: "CERCA",
    premium: false,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=86",
  },
];

const premiumBenefits = [
  ["♥", "Más likes", "Más capacidad para conectar cada mes."],
  ["↗", "Mayor visibilidad", "Tu perfil y tus planes aparecen antes en recomendaciones."],
  ["%", "Ofertas exclusivas", "Descuentos y ventajas reservadas para miembros Premium."],
  ["★", "Distintivo Premium", "Tu cuenta se identifica visualmente dentro de CONECTA."],
  ["⚡", "Prioridad", "Más presencia en descubrimiento, afinidad y sugerencias."],
];

function createExploreHighlights() {
  const section = document.createElement("section");
  section.className = "cx-explore-highlights";
  section.innerHTML = `
    <div class="cx-section-heading">
      <div><span>PARA TI HOY</span><h2>Más formas de descubrir</h2></div>
      <small>Contenido distinto, sin repetir planes</small>
    </div>
    <div class="cx-highlight-scroll">
      ${exploreCards.map((card) => `
        <article class="cx-highlight-card ${card.tone}">
          <img src="${card.image}" alt="" />
          <div class="cx-highlight-shade"></div>
          <div class="cx-highlight-copy">
            <span>${card.eyebrow}</span>
            <h3>${card.title}</h3>
            <p>${card.text}</p>
            <b>${card.meta}</b>
          </div>
        </article>
      `).join("")}
    </div>
  `;
  return section;
}

function createPremiumPromo(compact = false) {
  const section = document.createElement("section");
  section.className = `cx-premium-promo${compact ? " compact" : ""}`;
  section.innerHTML = `
    <div class="cx-premium-head">
      <div><span>CONECTA PREMIUM</span><h2>Más visibilidad. Más ventajas.</h2><p>Una suscripción útil para quien quiere aprovechar más la aplicación.</p></div>
      <div class="cx-premium-price"><strong>4,99 €</strong><small>/ mes</small></div>
    </div>
    <div class="cx-premium-benefits">
      ${premiumBenefits.map(([icon, title, text]) => `<article><i>${icon}</i><div><b>${title}</b><small>${text}</small></div></article>`).join("")}
    </div>
    <div class="cx-premium-foot"><span>✓ Ofertas Premium · ✓ Distintivo · ✓ Prioridad de visibilidad</span><button type="button" data-cx-premium-info>Ver Premium</button></div>
  `;
  section.querySelector<HTMLButtonElement>("[data-cx-premium-info]")?.addEventListener("click", () => {
    const modal = document.createElement("div");
    modal.className = "cx-premium-modal";
    modal.innerHTML = `<div class="cx-premium-modal-card"><button type="button" class="cx-premium-close" aria-label="Cerrar">×</button><span>CONECTA PREMIUM</span><h2>4,99 € al mes</h2><p>Incluye más likes, mayor visibilidad, ofertas exclusivas, distintivo Premium y prioridad en recomendaciones.</p><div>${premiumBenefits.map(([icon, title, text]) => `<article><i>${icon}</i><div><b>${title}</b><small>${text}</small></div></article>`).join("")}</div><button type="button" class="cx-premium-soon">Activación próximamente</button></div>`;
    modal.querySelector(".cx-premium-close")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  });
  return section;
}

function createLocalDiscovery() {
  const section = document.createElement("section");
  section.className = "cx-local-discovery";
  section.innerHTML = `
    <div class="cx-section-heading">
      <div><span>DESCUBRE CERCA</span><h2>Restaurantes, gimnasios y ventajas</h2></div>
      <small>Las ofertas exclusivas son Premium</small>
    </div>
    <div class="cx-local-grid">
      ${localCards.map((card) => `
        <article class="cx-local-card${card.premium ? " premium-locked" : ""}">
          <img src="${card.image}" alt="" />
          <div class="cx-local-overlay"></div>
          <span class="cx-local-badge">${card.badge}</span>
          ${card.premium ? `<span class="cx-premium-lock">♛ SOLO PREMIUM</span>` : ""}
          <div class="cx-local-copy">
            <i>${card.icon}</i>
            <span>${card.eyebrow}</span>
            <h3>${card.title}</h3>
            <p>${card.text}</p>
            <button type="button" ${card.premium ? "data-cx-premium-offer" : ""}>${card.premium ? "Premium · 4,99 €" : "Explorar"} <b>→</b></button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
  section.querySelector<HTMLButtonElement>("[data-cx-premium-offer]")?.addEventListener("click", () => {
    document.querySelector<HTMLElement>(".cx-premium-promo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return section;
}

function createConnectStrip() {
  const section = document.createElement("section");
  section.className = "cx-connect-strip";
  section.innerHTML = `
    <article><span>✓</span><div><b>Perfiles verificados</b><small>Más confianza antes de quedar</small></div></article>
    <article><span>♥</span><div><b>Afinidad real</b><small>Intereses, ritmo y disponibilidad</small></div></article>
    <article><span>★</span><div><b>Reputación visible</b><small>Asistencia y valoraciones útiles</small></div></article>
  `;
  return section;
}

function createChatStrip() {
  const section = document.createElement("section");
  section.className = "cx-chat-strip";
  section.innerHTML = `
    <div><span>💬</span><b>Organiza el plan</b><small>Hora, lugar y material</small></div>
    <div><span>📍</span><b>Comparte ubicación</b><small>Puntos públicos y seguros</small></div>
    <div><span>📸</span><b>Fotos y recuerdos</b><small>Todo dentro del chat</small></div>
  `;
  return section;
}

function dedupeExplorePlans(page: HTMLElement) {
  const seen = new Set<string>();
  page.querySelectorAll<HTMLElement>(".plans-grid .plan-card").forEach((card) => {
    const title = (card.querySelector("h3")?.textContent || "").trim().toLocaleLowerCase("es");
    if (!title) return;
    if (seen.has(title)) {
      card.dataset.cxDuplicate = "1";
      card.style.display = "none";
      return;
    }
    seen.add(title);
    delete card.dataset.cxDuplicate;
  });
}

function enhanceExplore(page: HTMLElement) {
  const hero = page.querySelector(".page-hero");
  const filterLayout = page.querySelector(".filter-layout");
  if (hero && !page.querySelector(".cx-explore-highlights")) hero.after(createExploreHighlights());
  if (filterLayout && !page.querySelector(".cx-local-discovery")) {
    const local = createLocalDiscovery();
    filterLayout.before(local);
    local.before(createPremiumPromo(true));
  }
  dedupeExplorePlans(page);
}

function enhanceConnect(page: HTMLElement) {
  const hero = page.querySelector(".page-hero");
  if (hero && !page.querySelector(".cx-connect-strip")) {
    const strip = createConnectStrip();
    hero.after(strip);
    strip.after(createPremiumPromo());
  }
}

function enhanceChat(page: HTMLElement) {
  const feature = page.querySelector(".cx-chat-feature") || page.querySelector(".page-hero");
  if (feature && !page.querySelector(".cx-chat-strip")) feature.after(createChatStrip());
}

function syncSecondaryContent() {
  document.querySelectorAll<HTMLElement>(".view-page[data-premium-view]").forEach((page) => {
    if (page.dataset.premiumView === "explorar") enhanceExplore(page);
    if (page.dataset.premiumView === "conectar") enhanceConnect(page);
    if (page.dataset.premiumView === "chat") enhanceChat(page);
  });
}

let contentQueued = false;
const queueSecondaryContent = () => {
  if (contentQueued) return;
  contentQueued = true;
  requestAnimationFrame(() => {
    contentQueued = false;
    syncSecondaryContent();
  });
};

new MutationObserver(queueSecondaryContent).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueSecondaryContent);
window.addEventListener("pageshow", queueSecondaryContent);
queueSecondaryContent();