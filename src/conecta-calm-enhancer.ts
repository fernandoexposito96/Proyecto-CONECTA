const SECTION_KEY = "data-conecta-calm-section";

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

type CalmMeta = { id: string; title: string; subtitle: string; icon: string };
type CalmEntry = { section: HTMLElement; meta: CalmMeta };

function classifySection(section: HTMLElement): CalmMeta {
  const text = normalize(section.textContent ?? "");
  if (text.includes("identidad") || text.includes("seguridad")) return { id: "verification", title: "Verificación y seguridad", subtitle: "Selfie, identidad y protección", icon: "✓" };
  if (text.includes("ia que hace trabajo") || text.includes("resum") || text.includes("emparejar")) return { id: "assistant", title: "Asistente inteligente", subtitle: "IA útil cuando tú la necesites", icon: "✦" };
  if (text.includes("recuerdo") || text.includes("capsula")) return { id: "memories", title: "Recuerdos", subtitle: "Fotos y cápsulas de tus planes", icon: "▣" };
  if (text.includes("reputacion") || text.includes("resena") || text.includes("valoracion")) return { id: "reputation", title: "Reputación", subtitle: "Valoraciones y confianza", icon: "★" };
  if (text.includes("comunidad") || text.includes("organizador")) return { id: "community", title: "Comunidad", subtitle: "Herramientas para grupos y organizadores", icon: "◎" };
  if (text.includes("contenido") || text.includes("perfil publico")) return { id: "content", title: "Contenido y perfil", subtitle: "Lo que compartes y cómo se ve", icon: "◇" };
  return { id: "more", title: "Más herramientas", subtitle: "Opciones avanzadas", icon: "+" };
}

function enhanceProductHub(hub: HTMLElement) {
  if (hub.dataset.calmEnhanced === "1") return;
  const sections = Array.from(hub.querySelectorAll<HTMLElement>(":scope > .section-block"));
  if (!sections.length) return;

  hub.dataset.calmEnhanced = "1";
  hub.classList.add("conecta-calm-mode");

  const entries: CalmEntry[] = sections.map((section) => {
    const meta = classifySection(section);
    section.setAttribute(SECTION_KEY, meta.id);
    section.classList.add("calm-collapsible-section");
    section.hidden = true;
    return { section, meta };
  });

  const grouped = new Map<string, { meta: CalmMeta; sections: HTMLElement[] }>();
  for (const { section, meta } of entries) {
    const current = grouped.get(meta.id);
    if (current) current.sections.push(section);
    else grouped.set(meta.id, { meta, sections: [section] });
  }

  const panel = document.createElement("section");
  panel.className = "calm-control-panel";
  panel.setAttribute("aria-label", "Herramientas de Conecta");
  panel.innerHTML = `
    <div class="calm-control-copy">
      <span>TODO ORDENADO</span>
      <h2>Abre solo lo que necesites</h2>
      <p>Las funciones avanzadas están agrupadas para que Conectar sea rápido, limpio y fácil de recorrer.</p>
    </div>
    <div class="calm-control-grid"></div>
  `;

  const grid = panel.querySelector<HTMLElement>(".calm-control-grid");
  if (!grid) return;

  let openId: string | null = null;
  const buttons = new Map<string, HTMLButtonElement>();

  const setOpen = (id: string | null) => {
    openId = id;
    for (const [groupId, group] of grouped) {
      const isOpen = groupId === id;
      for (const section of group.sections) {
        section.hidden = !isOpen;
        section.classList.toggle("is-open", isOpen);
      }
      const button = buttons.get(groupId);
      if (button) {
        button.classList.toggle("active", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        const action = button.querySelector<HTMLElement>(".calm-card-action");
        if (action) action.textContent = isOpen ? "Ocultar" : "Ver más";
      }
    }
    if (id) {
      const first = grouped.get(id)?.sections[0];
      if (first) window.requestAnimationFrame(() => first.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  for (const [id, { meta, sections: groupedSections }] of grouped) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calm-control-card";
    button.setAttribute("aria-expanded", "false");
    const countLabel = groupedSections.length > 1 ? `<small class="calm-card-count">${groupedSections.length} apartados</small>` : "";
    button.innerHTML = `
      <span class="calm-card-icon">${meta.icon}</span>
      <span class="calm-card-copy"><strong>${meta.title}</strong><small>${meta.subtitle}</small>${countLabel}</span>
      <span class="calm-card-action">Ver más</span>
    `;
    button.addEventListener("click", () => setOpen(openId === id ? null : id));
    buttons.set(id, button);
    grid.appendChild(button);
  }

  const verification = grouped.get("verification")?.sections[0];
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
      identityCard.querySelector("p")?.insertAdjacentElement("afterend", steps);
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
