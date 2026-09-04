import { supabase } from "./supabase";
import "./account-center.css";

type PanelKey = "conecta" | "privacy" | "rights" | "help" | "terms";

const panels: Record<PanelKey, { title: string; eyebrow: string; body: string }> = {
  conecta: {
    eyebrow: "SOBRE CONECTA",
    title: "Tu mundo, tu gente y tus planes",
    body: `
      <section class="ac-hero-card"><div><span>CONECTA</span><h3>Una app social para pasar de hablar a hacer planes reales.</h3><p>Descubre personas, crea planes, únete a grupos, organiza tu agenda y mantén el contacto con seguridad.</p></div></section>
      <div class="ac-info-grid">
        <article><b>Qué puedes hacer</b><ul><li>Descubrir planes por categoría, fecha y ubicación.</li><li>Crear planes y comunidades.</li><li>Conectar con personas compatibles.</li><li>Usar chat, calendario, mapa y modo Ahora.</li><li>Guardar planes, gestionar asistencia y recibir recordatorios.</li><li>Usar herramientas de seguridad, reputación y verificación.</li></ul></article>
        <article><b>Qué no está permitido</b><ul><li>Acoso, amenazas, discriminación o contenido sexual no consentido.</li><li>Suplantación de identidad o perfiles engañosos.</li><li>Estafas, spam o captación fraudulenta.</li><li>Quedadas que oculten riesgos o incumplan las normas.</li><li>Publicar datos privados de otras personas sin permiso.</li></ul></article>
      </div>
      <article class="ac-premium-summary"><span class="ac-mini-metal">P</span><div><b>CONECTA Premium</b><p>4,99 €/mes · más visibilidad, funciones avanzadas y ventajas en gimnasios, viajes, comida, ocio y servicios asociados.</p></div><button data-open-premium>Ver Premium</button></article>
    `,
  },
  privacy: {
    eyebrow: "PRIVACIDAD Y SEGURIDAD",
    title: "Tus datos, bajo tu control",
    body: `
      <div class="ac-info-grid single">
        <article><b>Privacidad por diseño</b><p>CONECTA utiliza los datos necesarios para prestar el servicio, personalizar recomendaciones y mantener la seguridad. La ubicación precisa no se muestra públicamente por defecto.</p></article>
        <article><b>Control de visibilidad</b><p>Puedes configurar perfil público, solo conexiones o privado, además de limitar edad, estado online, mensajes y ubicación.</p></article>
        <article><b>Seguridad</b><p>Las primeras quedadas deben priorizar lugares públicos. La app incorpora bloqueo, denuncia, verificación, contacto de emergencia y herramientas de seguridad durante los planes.</p></article>
        <article><b>Cuenta y acceso</b><p>Correo verificado, sesión segura y opciones de autenticación reforzada forman parte de la protección de la cuenta.</p></article>
      </div>
      <div class="ac-legal-note"><b>Importante:</b> este apartado es un resumen comprensible. Antes del lanzamiento comercial, la política definitiva debe reflejar exactamente proveedores, conservación, transferencias y finalidades reales.</div>
    `,
  },
  rights: {
    eyebrow: "TUS DERECHOS",
    title: "Control sobre tu información",
    body: `
      <div class="ac-rights-list">
        <article><span>01</span><div><b>Acceso</b><p>Saber qué datos personales conserva CONECTA sobre ti.</p></div></article>
        <article><span>02</span><div><b>Rectificación</b><p>Corregir información inexacta o incompleta.</p></div></article>
        <article><span>03</span><div><b>Supresión</b><p>Solicitar la eliminación de tus datos cuando corresponda.</p></div></article>
        <article><span>04</span><div><b>Limitación</b><p>Pedir que determinados tratamientos queden restringidos.</p></div></article>
        <article><span>05</span><div><b>Portabilidad</b><p>Recibir datos facilitados por ti en formato estructurado cuando proceda.</p></div></article>
        <article><span>06</span><div><b>Oposición</b><p>Oponerte a determinados usos de tus datos cuando exista base para ello.</p></div></article>
        <article><span>07</span><div><b>Retirar consentimiento</b><p>Retirar un consentimiento previamente dado.</p></div></article>
        <article><span>08</span><div><b>Reclamación</b><p>Acudir a la autoridad de protección de datos competente.</p></div></article>
      </div>
    `,
  },
  help: {
    eyebrow: "AYUDA Y SOPORTE",
    title: "Estamos para ayudarte",
    body: `<div class="ac-info-grid single"><article><b>Problemas con la cuenta</b><p>Acceso, verificación, sesión o recuperación.</p></article><article><b>Seguridad y denuncias</b><p>Bloqueos, comportamiento inapropiado, incidencias en un plan o ayuda urgente.</p></article><article><b>Planes, pagos y Premium</b><p>Consultas sobre ventajas, suscripciones, cancelaciones y promociones.</p></article><article><b>Errores técnicos</b><p>Fallos de carga, botones, ubicación, chat, notificaciones o instalación.</p></article></div>`,
  },
  terms: {
    eyebrow: "CONDICIONES DE USO",
    title: "Normas claras para una comunidad segura",
    body: `<div class="ac-terms"><p><b>Edad y cuenta.</b> La persona usuaria debe cumplir la edad mínima aplicable y proporcionar información veraz.</p><p><b>Conducta.</b> No se permiten acoso, amenazas, discriminación, fraude, spam, suplantación ni publicación de datos ajenos sin autorización.</p><p><b>Planes.</b> Cada participante es responsable de valorar si un plan es adecuado.</p><p><b>Contenido.</b> Quien publica contenido debe tener derecho a hacerlo y respetar privacidad y propiedad intelectual.</p><p><b>Moderación.</b> CONECTA puede limitar, suspender o retirar contenido o cuentas ante incumplimientos o riesgos.</p><p><b>Premium.</b> Precio, renovación, cancelación y reembolsos se mostrarán de forma transparente antes de cualquier cobro.</p></div><div class="ac-legal-note"><b>Texto de producto.</b> Los textos legales definitivos deben revisarse antes del lanzamiento comercial.</div>`,
  },
};

function closePanel() { document.querySelector(".ac-overlay")?.remove(); }

function openPremium() {
  const premium = document.querySelector<HTMLButtonElement>(".conecta-premium-mobile, .conecta-premium-entry");
  premium?.click();
}

function openPanel(key: PanelKey) {
  closePanel();
  const data = panels[key];
  const overlay = document.createElement("div");
  overlay.className = "ac-overlay";
  overlay.innerHTML = `<section class="ac-panel"><header><button class="ac-close" aria-label="Cerrar">×</button><span>${data.eyebrow}</span><h2>${data.title}</h2></header><div class="ac-panel-body">${data.body}</div></section>`;
  overlay.querySelector(".ac-close")?.addEventListener("click", closePanel);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) closePanel(); });
  overlay.querySelector("[data-open-premium]")?.addEventListener("click", () => { closePanel(); openPremium(); });
  document.body.appendChild(overlay);
}

function makeRow(icon: string, title: string, subtitle: string, action: () => void, tone = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ac-menu-item ${tone}`.trim();
  button.innerHTML = `<span class="ac-menu-icon">${icon}</span><span class="ac-menu-copy"><strong>${title}</strong><small>${subtitle}</small></span><b>›</b>`;
  button.addEventListener("click", action);
  return button;
}

function addSection(nav: HTMLElement, title: string, rows: HTMLElement[]) {
  const section = document.createElement("section");
  section.className = "ac-menu-section";
  section.innerHTML = `<h3>${title}</h3>`;
  const list = document.createElement("div");
  list.className = "ac-menu-center";
  rows.forEach((row) => list.appendChild(row));
  section.appendChild(list);
  nav.appendChild(section);
}

function enhanceMenu() {
  const nav = document.querySelector<HTMLElement>(".mobile-menu-list");
  if (!nav || nav.dataset.accountCenter === "2") return;

  const originalButtons = Array.from(nav.querySelectorAll<HTMLButtonElement>(":scope > button"));
  const find = (label: string) => originalButtons.find((button) => button.textContent?.trim().includes(label));
  const clickOriginal = (label: string) => () => find(label)?.click();

  nav.dataset.accountCenter = "2";
  originalButtons.forEach((button) => button.classList.add("ac-original-nav-item"));

  const premiumCard = document.createElement("button");
  premiumCard.type = "button";
  premiumCard.className = "ac-premium-feature-card";
  premiumCard.innerHTML = `
    <span class="ac-premium-copy"><small>CONECTA PREMIUM</small><strong>Más planes. Más gente.<br/>Más experiencias.</strong><em>Ventajas, ofertas y mayor visibilidad.</em><b>Descubrir Premium <i>›</i></b></span>
    <span class="ac-premium-price">4,99 €/mes</span>
    <span class="ac-metal-card" aria-hidden="true"><i>CONECTA</i><small>PREMIUM</small><em>MEMBER</em></span>
  `;
  premiumCard.addEventListener("click", openPremium);
  nav.prepend(premiumCard);

  const mainWrap = document.createElement("section");
  mainWrap.className = "ac-main-nav";
  ["Inicio", "Explorar", "Ahora", "Mapa", "Planes", "Grupos", "Chat", "Calendario"].forEach((label) => {
    const button = find(label);
    if (button) mainWrap.appendChild(button);
  });
  premiumCard.after(mainWrap);

  ["Conecta+", "Perfil", "Seguridad"].forEach((label) => {
    const button = find(label);
    if (button) button.classList.add("ac-hidden-original");
  });

  addSection(nav, "TU CUENTA", [
    makeRow("◯", "Mi perfil", "Datos, fotos y preferencias", clickOriginal("Perfil"), "profile"),
    makeRow("♡", "Conecta+", "Ventajas y herramientas especiales", clickOriginal("Conecta+"), "connecta"),
    makeRow("⚙", "Ajustes", "Personaliza tu experiencia", () => openPanel("conecta"), "settings"),
  ]);

  addSection(nav, "SEGURIDAD Y PRIVACIDAD", [
    makeRow("♢", "Seguridad", "Verificación, bloqueos y control", clickOriginal("Seguridad"), "security"),
    makeRow("▢", "Privacidad", "Datos, ubicación y visibilidad", () => openPanel("privacy"), "privacy"),
    makeRow("≡", "Tus derechos", "Gestiona tus datos y solicitudes", () => openPanel("rights"), "rights"),
  ]);

  addSection(nav, "SOPORTE Y LEGAL", [
    makeRow("?", "Ayuda y soporte", "Centro de ayuda y contacto", () => openPanel("help"), "help"),
    makeRow("◎", "Normas de la comunidad", "Convivencia y uso responsable", () => openPanel("terms"), "rules"),
    makeRow("▤", "Condiciones de uso", "Términos y condiciones", () => openPanel("terms"), "terms"),
    makeRow("✓", "Política de privacidad", "Cómo protegemos tus datos", () => openPanel("privacy"), "policy"),
  ]);

  const logout = document.createElement("button");
  logout.type = "button";
  logout.className = "ac-logout";
  logout.innerHTML = `<span>↪</span><strong>Cerrar sesión</strong><b>›</b>`;
  logout.addEventListener("click", async () => { await supabase.auth.signOut(); window.location.reload(); });
  nav.appendChild(logout);

  const footer = document.createElement("div");
  footer.className = "ac-menu-footer";
  footer.innerHTML = `<b>CONECTA 1.0</b><span>Tu mundo, tu gente y tus planes.</span>`;
  nav.appendChild(footer);
}

let queued = false;
const sync = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; enhanceMenu(); });
};

new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", sync);
window.addEventListener("pageshow", sync);
sync();
