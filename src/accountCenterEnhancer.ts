import { supabase } from "./supabase";
import "./account-center.css";

type PanelKey = "conecta" | "privacy" | "rights" | "help" | "terms";

const panels: Record<PanelKey, { title: string; eyebrow: string; body: string }> = {
  conecta: {
    eyebrow: "SOBRE CONECTA",
    title: "Tu mundo, tu gente y tus planes",
    body: `
      <section class="ac-hero-card">
        <div><span>✨ CONECTA</span><h3>Una app social para pasar de hablar a hacer planes reales.</h3><p>Descubre personas, crea planes, únete a grupos, organiza tu agenda y mantén el contacto con seguridad.</p></div>
      </section>
      <div class="ac-info-grid">
        <article><b>Qué puedes hacer</b><ul><li>Descubrir planes por categoría, fecha y ubicación.</li><li>Crear planes y comunidades.</li><li>Conectar con personas compatibles.</li><li>Usar chat, calendario, mapa y modo Ahora.</li><li>Guardar planes, gestionar asistencia y recibir recordatorios.</li><li>Usar herramientas de seguridad, reputación y verificación.</li></ul></article>
        <article><b>Qué no está permitido</b><ul><li>Acoso, amenazas, discriminación o contenido sexual no consentido.</li><li>Suplantación de identidad o perfiles engañosos.</li><li>Estafas, spam o captación fraudulenta.</li><li>Quedadas públicas que oculten riesgos o incumplan las normas.</li><li>Publicar datos privados de otras personas sin permiso.</li></ul></article>
      </div>
      <article class="ac-premium-summary"><span>👑</span><div><b>CONECTA Premium</b><p>4,99 €/mes · más visibilidad, funciones avanzadas y ventajas en gimnasios, viajes, comida, ocio y servicios asociados.</p></div><button data-open-premium>Ver Premium</button></article>
    `,
  },
  privacy: {
    eyebrow: "PRIVACIDAD Y SEGURIDAD",
    title: "Tus datos, bajo tu control",
    body: `
      <div class="ac-info-grid single">
        <article><b>Privacidad por diseño</b><p>CONECTA debe usar solo los datos necesarios para prestar el servicio, personalizar recomendaciones y mantener la seguridad. La ubicación precisa no debe mostrarse públicamente por defecto.</p></article>
        <article><b>Control de visibilidad</b><p>Puedes configurar perfil público, solo conexiones o privado, además de limitar edad, estado online, mensajes y ubicación.</p></article>
        <article><b>Seguridad</b><p>Las primeras quedadas deben priorizar lugares públicos. La app incorpora bloqueo, denuncia, verificación, contacto de emergencia y herramientas de seguridad durante los planes.</p></article>
        <article><b>Cuenta y acceso</b><p>Correo verificado, sesión segura y opciones de autenticación reforzada forman parte de la protección de la cuenta.</p></article>
      </div>
      <div class="ac-legal-note"><b>Importante:</b> este apartado funciona como resumen comprensible dentro de la app. Antes del lanzamiento comercial, la política de privacidad definitiva debe revisarse legalmente y reflejar exactamente proveedores, conservación, transferencias y finalidades reales.</div>
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
        <article><span>05</span><div><b>Portabilidad</b><p>Recibir datos facilitados por ti en un formato estructurado cuando proceda.</p></div></article>
        <article><span>06</span><div><b>Oposición</b><p>Oponerte a determinados usos de tus datos cuando exista base para ello.</p></div></article>
        <article><span>07</span><div><b>Retirar consentimiento</b><p>Retirar un consentimiento previamente dado sin afectar al tratamiento anterior.</p></div></article>
        <article><span>08</span><div><b>Reclamación</b><p>Acudir a la autoridad de protección de datos competente si consideras vulnerados tus derechos.</p></div></article>
      </div>
      <div class="ac-legal-note">También debes poder descargar tus datos, cerrar sesión y solicitar la eliminación de la cuenta desde un lugar claro y accesible.</div>
    `,
  },
  help: {
    eyebrow: "AYUDA Y SOPORTE",
    title: "Estamos para ayudarte",
    body: `
      <div class="ac-info-grid single">
        <article><b>Problemas con la cuenta</b><p>Acceso, verificación, contraseña, sesión o recuperación.</p></article>
        <article><b>Seguridad y denuncias</b><p>Bloqueos, comportamiento inapropiado, incidencias en un plan o ayuda urgente.</p></article>
        <article><b>Planes, pagos y Premium</b><p>Consultas sobre ventajas, futuras suscripciones, cancelaciones y promociones.</p></article>
        <article><b>Errores técnicos</b><p>Fallos de carga, botones, ubicación, chat, notificaciones o instalación PWA.</p></article>
      </div>
      <p class="ac-muted">Antes del lanzamiento público conviene añadir aquí el correo oficial de soporte y los tiempos de respuesta.</p>
    `,
  },
  terms: {
    eyebrow: "CONDICIONES DE USO",
    title: "Normas claras para una comunidad segura",
    body: `
      <div class="ac-terms">
        <p><b>Edad y cuenta.</b> La persona usuaria debe cumplir la edad mínima aplicable y proporcionar información veraz.</p>
        <p><b>Conducta.</b> No se permiten acoso, amenazas, discriminación, fraude, spam, suplantación ni publicación de datos ajenos sin autorización.</p>
        <p><b>Planes.</b> Cada participante es responsable de valorar si un plan es adecuado. CONECTA facilita herramientas de organización y seguridad, pero no puede garantizar la conducta individual de cada usuario.</p>
        <p><b>Contenido.</b> Quien publica contenido debe tener derecho a hacerlo y respetar la privacidad y propiedad intelectual de terceros.</p>
        <p><b>Moderación.</b> CONECTA puede limitar, suspender o retirar contenido o cuentas cuando existan incumplimientos, riesgos de seguridad o exigencias legales.</p>
        <p><b>Premium.</b> Las ventajas, precio, renovación, cancelación y reembolsos deberán mostrarse de forma transparente antes de activar cualquier cobro.</p>
        <p><b>Cambios.</b> Las condiciones deben indicar fecha de entrada en vigor y comunicar cambios relevantes cuando sea necesario.</p>
      </div>
      <div class="ac-legal-note"><b>Texto de producto, no asesoramiento jurídico.</b> Las condiciones finales, política de privacidad, cookies y textos de pago deben revisarse antes de publicar comercialmente la app.</div>
    `,
  },
};

function closePanel() {
  document.querySelector(".ac-overlay")?.remove();
}

function openPanel(key: PanelKey) {
  closePanel();
  const data = panels[key];
  const overlay = document.createElement("div");
  overlay.className = "ac-overlay";
  overlay.innerHTML = `<section class="ac-panel"><header><button class="ac-close" aria-label="Cerrar">×</button><span>${data.eyebrow}</span><h2>${data.title}</h2></header><div class="ac-panel-body">${data.body}</div></section>`;
  overlay.querySelector(".ac-close")?.addEventListener("click", closePanel);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) closePanel(); });
  overlay.querySelector("[data-open-premium]")?.addEventListener("click", () => {
    closePanel();
    const premium = document.querySelector<HTMLButtonElement>(".conecta-premium-mobile, .conecta-premium-entry");
    premium?.click();
  });
  document.body.appendChild(overlay);
}

function addItem(parent: HTMLElement, icon: string, title: string, subtitle: string, action: () => void, tone = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ac-menu-item ${tone}`.trim();
  button.innerHTML = `<span class="ac-menu-icon">${icon}</span><span class="ac-menu-copy"><strong>${title}</strong><small>${subtitle}</small></span><b>›</b>`;
  button.addEventListener("click", action);
  parent.appendChild(button);
}

function enhanceMenu() {
  const nav = document.querySelector<HTMLElement>(".mobile-menu-list");
  if (!nav || nav.dataset.accountCenter === "1") return;
  nav.dataset.accountCenter = "1";

  const originalButtons = Array.from(nav.querySelectorAll<HTMLButtonElement>(":scope > button"));
  originalButtons.forEach((button) => { button.classList.add("ac-original-nav-item"); });

  const divider = document.createElement("div");
  divider.className = "ac-menu-divider";
  divider.innerHTML = `<span>CUENTA Y CONECTA</span>`;
  nav.appendChild(divider);

  const center = document.createElement("div");
  center.className = "ac-menu-center";
  nav.appendChild(center);

  addItem(center, "✨", "CONECTA", "Qué es, qué puedes hacer y normas", () => openPanel("conecta"));
  addItem(center, "👑", "CONECTA Premium", "Ventajas exclusivas · 4,99 €/mes", () => document.querySelector<HTMLButtonElement>(".conecta-premium-mobile, .conecta-premium-entry")?.click(), "premium");
  addItem(center, "🛡️", "Seguridad", "Verificación, bloqueos y protección", () => {
    const btn = originalButtons.find((item) => item.textContent?.includes("Seguridad"));
    btn?.click();
  });
  addItem(center, "🔐", "Privacidad", "Visibilidad, ubicación y datos", () => openPanel("privacy"));
  addItem(center, "📄", "Tus derechos y datos", "Acceso, descarga, borrado y control", () => openPanel("rights"));
  addItem(center, "💬", "Ayuda y soporte", "Cuenta, seguridad y errores técnicos", () => openPanel("help"));
  addItem(center, "⚖️", "Condiciones y normas", "Uso responsable y comunidad", () => openPanel("terms"));

  const logout = document.createElement("button");
  logout.type = "button";
  logout.className = "ac-logout";
  logout.innerHTML = `<span>↪</span><strong>Cerrar sesión</strong>`;
  logout.addEventListener("click", async () => { await supabase.auth.signOut(); window.location.reload(); });
  nav.appendChild(logout);
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
