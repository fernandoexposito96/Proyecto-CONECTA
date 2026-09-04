import "./premium-membership.css";

const benefits = [
  ["📍", "Más visibilidad local", "Prioridad en recomendaciones, planes cercanos y descubrimiento por ubicación."],
  ["👥", "Más conexiones", "Mayor exposición para encontrar personas afines y llenar tus planes antes."],
  ["🏋️", "Gimnasios y deporte", "Descuentos, pruebas, clases y promociones de centros asociados."],
  ["✈️", "Viajes y vuelos", "Ofertas seleccionadas para escapadas, vuelos, alojamientos y experiencias."],
  ["🍽️", "Restaurantes y comida", "Ventajas en restaurantes, brunch, cafeterías y gastronomía local."],
  ["🎟️", "Ocio y experiencias", "Promociones en eventos, conciertos, actividades, entradas y planes especiales."],
  ["⚡", "Funciones Premium", "Acceso prioritario a nuevas herramientas, filtros y funciones avanzadas de CONECTA."],
  ["💎", "Ventajas que crecen", "La membresía está preparada para añadir nuevos acuerdos y beneficios sin cambiar el plan."],
] as const;

const insideBenefits = [
  ["Perfil con más alcance", "Más presencia en descubrimiento, recomendaciones y zonas cercanas."],
  ["Filtros avanzados", "Más precisión por distancia, disponibilidad, intereses y tipo de plan."],
  ["Prioridad en novedades", "Acceso anticipado a nuevas funciones Premium cuando se publiquen."],
  ["Ofertas exclusivas", "Promociones de socios en deporte, viajes, comida, ocio y servicios."],
  ["Más control", "Herramientas Premium para gestionar mejor tus planes y tu experiencia."],
  ["Ventajas locales", "Beneficios pensados para descubrir y aprovechar mejor tu zona."],
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
        <div class="cp-kicker">CONECTA PREMIUM</div>
        <h2>Más ventajas. Más planes. Más CONECTA.</h2>
        <p>Una membresía pensada para darte más visibilidad dentro de la app y ventajas reales en deporte, viajes, comida, ocio y servicios.</p>
        <div class="cp-price-row"><strong>4,99 €</strong><span>/ mes</span></div>
      </header>

      <nav class="cp-tabs" aria-label="Categorías Premium">
        <button>Todo</button><button>Deporte</button><button>Viajes</button><button>Comida</button><button>Ocio</button><button>Cerca de ti</button>
      </nav>

      <div class="cp-section-title"><div><small>INCLUIDO EN PREMIUM</small><h3>Todo lo que ganas al activar tu plan</h3></div><span>Beneficios dentro y fuera de CONECTA</span></div>
      <div class="cp-benefits">${benefits.map(([icon,title,text]) => `<article class="cp-benefit"><span>${icon}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}</div>

      <div class="cp-section-title"><div><small>DENTRO DE LA APP</small><h3>Una experiencia más completa</h3></div><span>Más alcance, más control y nuevas herramientas</span></div>
      <div class="cp-premium-inside">${insideBenefits.map(([title,text]) => `<article class="cp-inside-card"><b>${title}</b><small>${text}</small></article>`).join("")}</div>

      <section class="cp-offers">
        <h3>Ventajas y ofertas Premium</h3>
        <p>Este espacio está preparado para que puedas ir incorporando nuevos acuerdos y promociones sin cambiar la membresía.</p>
        <div class="cp-offer-grid">${offerSeeds.map(([title,text]) => `<article class="cp-offer"><b>${title}</b><small>${text}</small></article>`).join("")}</div>
      </section>

      <div class="cp-note"><strong>Pago seguro pendiente de conexión.</strong> La sección Premium está preparada, pero el botón no cobra hasta conectar y validar la pasarela de pago.</div>
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

window.addEventListener("conecta:open-premium", openPremium);
