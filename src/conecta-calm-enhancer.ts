const SECTION_KEY = "data-conecta-calm-section";

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function classifySection(section: HTMLElement, index: number) {
  const text = normalize(section.textContent ?? "");
  if (text.includes("identidad") || text.includes("seguridad")) return { id: "verification", title: "Verificación y seguridad", subtitle: "Selfie, identidad y protección", icon: "✓" };
  if (text.includes("ia que hace trabajo") || text.includes("resum") || text.includes("emparejar")) return { id: "assistant", title: "Asistente inteligente", subtitle: "IA útil cuando tú la necesites", icon: "✦" };
  if (text.includes("recuerdo") || text.includes("capsula")) return { id: "memories", title: "Recuerdos", subtitle: "Fotos y cápsulas de tus planes", icon: "▣" };
  if (text.includes("reputacion") || text.includes("resena") || text.includes("valoracion")) return { id: "reputation", title: "Reputación", subtitle: "Valoraciones y confianza", icon: "★" };
  if (text.includes("comunidad") || text.includes("organizador")) return { id: "community", title: "Comunidad", subtitle: "Herramientas para grupos y organizadores", icon: "◎" };
  if (text.includes("contenido") || text.includes("perfil publico")) return { id: "content", title: "Contenido y perfil", subtitle: "Lo que compartes y cómo se ve", icon: "◇" };
  return { id: `more-${index}`, title: "Más herramientas", subtitle: "Opciones avanzadas", icon: "+" };
}

function enhanceProductHub(hub: HTMLElement) {
  if (hub.dataset.calmEnhanced === "1") return;
  const sections = Array.from(hub.querySelectorAll<HTMLElement>(":scope > .section-block"));
  if (!sections.length) return;
  hub.dataset.calmEnhanced = "1";
  hub.classList.add("conecta-calm-mode");

  const entries = sections.map((section, index) => {
    const meta = classifySection(section, index);
    section.setAttribute(SECTION_KEY, meta.id);
    section.classList.add("calm-collapsible-section");
    section.hidden = true;
    return { section, meta };
  });

  const panel = document.createElement("section");
  panel.className = "calm-control-panel";
  panel.setAttribute("aria-label", "Herramientas de Conecta");
  panel.innerHTML = `
    <div class="calm-control-copy">
      <span>TODO ORDENADO</span>
      <h2>Abre solo lo que necesites</h2>
      <p>Las funciones avanzadas ya no ocupan toda la pantalla. Elige una categoría y se abrirá debajo.</p>
    </div>
    <div class="calm-control-grid"></div>
  `;

  const grid = panel.querySelector<HTMLElement>(".calm-control-grid");
  if (!grid) return;

  let openId: string | null = null;
  const buttons = new Map<string, HTMLButtonElement>();

  const setOpen = (id: string | null) => {
    openId = id;
    for (const { section, meta } of entries) {
      const isOpen = meta.id === id;
      section.hidden = !isOpen;
      section.classList.toggle("is-open", isOpen);
      const button = buttons.get(meta.id);
      if (button) {
        button.classList.toggle("active", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        const action = button.querySelector<HTMLElement>(".calm-card-action");
        if (action) action.textContent = isOpen ? "Ocultar" : "Ver más";
      }
      if (isOpen) {
        window.requestAnimationFrame(() => section.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    }
  };

  for (const { meta } of entries) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calm-control-card";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `
      <span class="calm-card-icon">${meta.icon}</span>
      <span class="calm-card-copy"><strong>${meta.title}</strong><small>${meta.subtitle}</small></span>
      <span class="calm-card-action">Ver más</span>
    `;
    button.addEventListener("click", () => setOpen(openId === meta.id ? null : meta.id));
    buttons.set(meta.id, button);
    grid.appendChild(button);
  }

  const verification = entries.find(({ meta }) => meta.id === "verification")?.section;
  if (verification) {
    const identityCard = verification.querySelector<HTMLElement>(".identity-action");
    if (identityCard && !identityCard.querySelector(".verification-steps")) {
      const steps = document.createElement("div");
      steps.className = "verification-steps";
      steps.innerHTML = `
        <div><b>1</b><span><strong>Selfie rápida</strong><small>Graba unos segundos mirando a cámara.</small></span></div>
        <div><b>2</b><span><strong>Revisión privada</strong><small>Comprobamos que eres una persona real.</small></span></div>
        <div><b>3</b><span><strong>Sello verificado</strong><small>Cuando se apruebe, aparecerá en tu perfil.</small></span></div>
      `;
      const paragraph = identityCard.querySelector("p");
      paragraph?.insertAdjacentElement("afterend", steps);
    }
  }

  const hero = hub.querySelector(":scope > .page-hero, :scope > [class*='page-hero']");
  if (hero) hero.insertAdjacentElement("afterend", panel);
  else hub.prepend(panel);
}

function runCalmEnhancer() {
  document.querySelectorAll<HTMLElement>(".product-hub").forEach(enhanceProductHub);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runCalmEnhancer, { once: true });
else runCalmEnhancer();

const observer = new MutationObserver(() => runCalmEnhancer());
observer.observe(document.documentElement, { childList: true, subtree: true });
