import "./premium-membership.css";

const benefits = [
  ["📍", "Más visibilidad local", "Prioridad en recomendaciones, planes cercanos y descubrimiento por ubicación."],
  ["👥", "Más conexiones", "Mayor exposición para encontrar personas afines y llenar tus planes antes."],
  ["🏋️", "Gimnasios y deporte", "Espacio para descuentos, pruebas, clases y promociones de centros asociados."],
  ["✈️", "Viajes y vuelos", "Ofertas seleccionadas para escapadas, vuelos, alojamientos y experiencias."],
  ["🍽️", "Restaurantes y comida", "Ventajas en restaurantes, brunch, cafeterías, delivery y gastronomía local."],
  ["🎟️", "Ocio y experiencias", "Promociones en eventos, conciertos, actividades, entradas y planes especiales."],
  ["⚡", "Funciones Premium", "Acceso prioritario a nuevas herramientas, filtros y funciones avanzadas de CONECTA."],
  ["💎", "Ventajas que crecen", "La membresía está preparada para añadir nuevos acuerdos y beneficios sin cambiar el plan."],
] as const;

const offerSeeds = [
  ["Fitness", "Gimnasios, pádel, running y bienestar"],
  ["Travel", "Vuelos, hoteles, escapadas y transporte"],
  ["Food", "Restaurantes, cafés y gastronomía"],
  ["Events", "Entradas, ocio y experiencias"],
  ["Local", "Comercios y servicios cerca de ti"],
  ["CONECTA", "Visibilidad, filtros y ventajas dentro de la app"],
] as const;

function buildPanel() {
  const overlay = document.createElement("div");
  overlay.className = "cp-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "CONECTA Premium");
  overlay.innerHTML = `
    <section class="cp-panel">
      <header class="cp-head">
        <button class="cp-close" aria-label="Cerrar">×</button>
        <div class="cp-kicker">👑 CONECTA PREMIUM</div>
        <h2>Más ventajas. Más planes. Más CONECTA.</h2>
        <p>Una membresía pensada para darte más visibilidad dentro de la app y ventajas reales en deporte, viajes, comida, ocio y servicios.</p>
        <div class="cp-price-row"><strong>4,99 €</strong><span>/ mes</span></div>
      </header>
      <nav class="cp-tabs" aria-label="Categorías Premium">
        <button>Todo</button><button>Deporte</button><button>Viajes</button><button>Comida</button><button>Ocio</button><button>Cerca de ti</button>
      </nav>
      <div class="cp-benefits">${benefits.map(([icon,title,text]) => `<article class="cp-benefit"><span>${icon}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}</div>
      <section class="cp-offers">
        <h3>Ofertas y ventajas que podrás ir añadiendo</h3>
        <div class="cp-offer-grid">${offerSeeds.map(([title,text]) => `<article class="cp-offer"><b>${title}</b><small>${text}</small></article>`).join("")}</div>
      </section>
      <div class="cp-note"><strong>Pago seguro pendiente de conexión.</strong> La sección Premium ya queda preparada en la aplicación, pero el botón no cobrará hasta conectar el proveedor de suscripción y validar el flujo de pago.</div>
      <button class="cp-cta" type="button">Activar CONECTA Premium · 4,99 €/mes<small>El cobro se habilitará cuando la pasarela de pago esté conectada</small></button>
    </section>`;
  const close = () => overlay.remove();
  overlay.querySelector(".cp-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
  overlay.querySelector(".cp-cta")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("conecta:premium-checkout-requested"));
    const note = overlay.querySelector<HTMLElement>(".cp-note");
    if (note) note.innerHTML = "<strong>Premium preparado.</strong> Falta conectar el pago real; no se ha realizado ningún cargo.";
  });
  return overlay;
}

function openPremium() {
  if (document.querySelector(".cp-overlay")) return;
  document.body.appendChild(buildPanel());
}

function syncPremiumEntry() {
  const compactNav = document.querySelector<HTMLElement>(".sidebar .side-nav.compact");
  if (compactNav && !compactNav.querySelector(".conecta-premium-entry")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conecta-premium-entry";
    button.innerHTML = '<span class="cp-crown">👑</span><span><strong>CONECTA Premium</strong><small>Ventajas y ofertas exclusivas</small></span><b class="cp-price">4,99 €/mes</b>';
    button.addEventListener("click", openPremium);
    compactNav.appendChild(button);
  }

  const mobileNav = document.querySelector<HTMLElement>(".mobile-menu-list");
  if (mobileNav && !mobileNav.querySelector(".conecta-premium-mobile")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conecta-premium-mobile";
    button.innerHTML = '<span>👑</span> CONECTA Premium <b>4,99 €</b>';
    button.addEventListener("click", openPremium);
    mobileNav.appendChild(button);
  }
}

let queued = false;
const queueSync = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    syncPremiumEntry();
  });
};

new MutationObserver(queueSync).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueSync);
window.addEventListener("pageshow", queueSync);
queueSync();
