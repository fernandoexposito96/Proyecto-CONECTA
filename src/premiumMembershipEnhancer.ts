import "./premium-membership.css";

type PremiumItem = {
  id: string;
  icon: string;
  title: string;
  text: string;
  category: "all" | "sport" | "travel" | "food" | "leisure" | "local" | "conecta";
};

const benefits: PremiumItem[] = [
  { id: "visibility", icon: "●", title: "Más visibilidad local", text: "Más presencia en recomendaciones, planes cercanos y descubrimiento por ubicación.", category: "local" },
  { id: "connections", icon: "◎", title: "Más conexiones", text: "Mayor exposición para encontrar personas afines y llenar tus planes antes.", category: "conecta" },
  { id: "sport", icon: "✦", title: "Gimnasios y deporte", text: "Descuentos, pruebas, clases y promociones de centros asociados.", category: "sport" },
  { id: "travel", icon: "➤", title: "Viajes y vuelos", text: "Ofertas seleccionadas para vuelos, alojamientos, escapadas y experiencias.", category: "travel" },
  { id: "food", icon: "◈", title: "Restaurantes y comida", text: "Ventajas en restaurantes, brunch, cafeterías y gastronomía local.", category: "food" },
  { id: "leisure", icon: "◇", title: "Ocio y experiencias", text: "Promociones en eventos, conciertos, actividades, entradas y planes especiales.", category: "leisure" },
  { id: "features", icon: "⚡", title: "Funciones Premium", text: "Filtros avanzados, nuevas herramientas y prioridad en funciones de CONECTA.", category: "conecta" },
  { id: "growth", icon: "◆", title: "Ventajas que crecen", text: "Nuevos acuerdos y beneficios se podrán añadir sin cambiar tu plan.", category: "all" },
];

const insideBenefits = [
  ["Perfil con más alcance", "Más presencia en descubrimiento y recomendaciones."],
  ["Filtros avanzados", "Más precisión por distancia, disponibilidad e intereses."],
  ["Novedades antes", "Prioridad para probar nuevas funciones Premium."],
  ["Ofertas exclusivas", "Promociones de socios y ventajas especiales."],
] as const;

const offers = [
  ["Fitness", "Gimnasios, pádel, running y bienestar"],
  ["Travel", "Vuelos, hoteles, escapadas y transporte"],
  ["Food", "Restaurantes, cafés y gastronomía"],
  ["Events", "Entradas, ocio y experiencias"],
  ["Local", "Comercios y servicios cerca de ti"],
  ["CONECTA", "Visibilidad, filtros y ventajas dentro de la app"],
] as const;

const categories = [
  ["all", "Todo"],
  ["sport", "Deporte"],
  ["travel", "Viajes"],
  ["food", "Comida"],
  ["leisure", "Ocio"],
  ["local", "Cerca de ti"],
] as const;

function renderBenefit(item: PremiumItem) {
  return `<article class="cp-benefit" data-category="${item.category}">
    <span class="cp-benefit-icon" aria-hidden="true">${item.icon}</span>
    <div><h3>${item.title}</h3><p>${item.text}</p></div>
  </article>`;
}

function buildPanel() {
  document.querySelector(".cp-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "cp-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "CONECTA Premium");

  overlay.innerHTML = `
    <section class="cp-panel" data-premium-version="gold-final">
      <header class="cp-head">
        <button class="cp-close" type="button" aria-label="Cerrar">×</button>
        <div class="cp-head-copy">
          <span class="cp-kicker">CONECTA PREMIUM</span>
          <h2>Más ventajas.<br>Más planes.<br><em>Más CONECTA.</em></h2>
          <p>Una membresía pensada para darte más visibilidad, más conexiones y ventajas reales en deporte, viajes, restaurantes, ocio y servicios.</p>
          <div class="cp-price-row"><strong>4,99 €</strong><span>/ mes</span></div>
        </div>
        <div class="cp-gold-member-card" aria-hidden="true"><strong>CONECTA</strong><small>PREMIUM</small><span>MEMBER</span></div>
      </header>

      <nav class="cp-tabs" aria-label="Categorías Premium">
        ${categories.map(([id,label], index) => `<button type="button" data-filter="${id}" class="${index === 0 ? "active" : ""}">${label}</button>`).join("")}
      </nav>

      <section class="cp-section">
        <div class="cp-section-heading"><div><small>INCLUIDO EN PREMIUM</small><h3>Todo lo que ganas</h3></div><span>Beneficios claros, sin repetir</span></div>
        <div class="cp-benefits">${benefits.map(renderBenefit).join("")}</div>
      </section>

      <section class="cp-section cp-inside-section">
        <div class="cp-section-heading"><div><small>DENTRO DE CONECTA</small><h3>Una experiencia más completa</h3></div><span>Más alcance y más control</span></div>
        <div class="cp-premium-inside">${insideBenefits.map(([title,text]) => `<article class="cp-inside-card"><b>${title}</b><small>${text}</small></article>`).join("")}</div>
      </section>

      <section class="cp-offers">
        <div class="cp-offers-title"><span></span><h3>Ofertas y ventajas Premium</h3><span></span></div>
        <p>Espacio preparado para ir incorporando acuerdos nuevos sin cambiar la membresía.</p>
        <div class="cp-offer-grid">${offers.map(([title,text]) => `<article class="cp-offer"><b>${title}</b><small>${text}</small></article>`).join("")}</div>
      </section>

      <div class="cp-note"><strong>Pago seguro pendiente de conexión.</strong><span>Premium está preparado, pero no se realizará ningún cargo hasta conectar y validar la pasarela de pago.</span></div>
      <button class="cp-cta" type="button"><strong>Activar CONECTA Premium · 4,99 €/mes</strong><small>El cobro se habilitará cuando la pasarela esté conectada</small></button>
    </section>`;

  const close = () => overlay.remove();
  overlay.querySelector(".cp-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });

  const filterButtons = Array.from(overlay.querySelectorAll<HTMLButtonElement>(".cp-tabs button"));
  const cards = Array.from(overlay.querySelectorAll<HTMLElement>(".cp-benefit"));
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      filterButtons.forEach((node) => node.classList.toggle("active", node === button));
      cards.forEach((card) => {
        const category = card.dataset.category || "all";
        card.hidden = filter !== "all" && category !== filter && category !== "all";
      });
    });
  });

  overlay.querySelector(".cp-cta")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("conecta:premium-checkout-requested"));
    const note = overlay.querySelector<HTMLElement>(".cp-note");
    if (note) note.innerHTML = "<strong>Premium preparado.</strong><span>Falta conectar el pago real; no se ha realizado ningún cargo.</span>";
  });

  return overlay;
}

function openPremium() {
  document.body.appendChild(buildPanel());
}

window.addEventListener("conecta:open-premium", openPremium);
