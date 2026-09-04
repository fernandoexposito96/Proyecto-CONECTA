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
    body: `<div class="ac-info-grid single"><article><b>Privacidad por diseño</b><p>CONECTA utiliza los datos necesarios para prestar el servicio, personalizar recomendaciones y mantener la seguridad. La ubicación precisa no se muestra públicamente por defecto.</p></article><article><b>Control de visibilidad</b><p>Puedes configurar perfil público, solo conexiones o privado, además de limitar edad, estado online, mensajes y ubicación.</p></article><article><b>Seguridad</b><p>Las primeras quedadas deben priorizar lugares públicos. La app incorpora bloqueo, denuncia, verificación, contacto de emergencia y herramientas de seguridad durante los planes.</p></article><article><b>Cuenta y acceso</b><p>Correo verificado, sesión segura y autenticación reforzada forman parte de la protección de la cuenta.</p></article></div>`,
  },
  rights: {
    eyebrow: "TUS DERECHOS",
    title: "Control sobre tu información",
    body: `<div class="ac-rights-list"><article><span>01</span><div><b>Acceso</b><p>Saber qué datos personales conserva CONECTA sobre ti.</p></div></article><article><span>02</span><div><b>Rectificación</b><p>Corregir información inexacta o incompleta.</p></div></article><article><span>03</span><div><b>Supresión</b><p>Solicitar la eliminación de tus datos cuando corresponda.</p></div></article><article><span>04</span><div><b>Limitación</b><p>Pedir que determinados tratamientos queden restringidos.</p></div></article><article><span>05</span><div><b>Portabilidad</b><p>Recibir tus datos en formato estructurado cuando proceda.</p></div></article><article><span>06</span><div><b>Oposición</b><p>Oponerte a determinados usos de tus datos cuando exista base para ello.</p></div></article></div>`,
  },
  help: {
    eyebrow: "AYUDA Y SOPORTE",
    title: "Estamos para ayudarte",
    body: `<div class="ac-info-grid single"><article><b>Problemas con la cuenta</b><p>Acceso, verificación, sesión o recuperación.</p></article><article><b>Seguridad y denuncias</b><p>Bloqueos, comportamiento inapropiado e incidencias en un plan.</p></article><article><b>Planes, pagos y Premium</b><p>Ventajas, suscripciones, cancelaciones y promociones.</p></article><article><b>Errores técnicos</b><p>Carga, botones, ubicación, chat, notificaciones o instalación.</p></article></div>`,
  },
  terms: {
    eyebrow: "CONDICIONES DE USO",
    title: "Normas claras para una comunidad segura",
    body: `<div class="ac-terms"><p><b>Edad y cuenta.</b> La persona usuaria debe cumplir la edad mínima aplicable y proporcionar información veraz.</p><p><b>Conducta.</b> No se permiten acoso, amenazas, discriminación, fraude, spam ni suplantación.</p><p><b>Planes.</b> Cada participante es responsable de valorar si un plan es adecuado.</p><p><b>Contenido.</b> Quien publica contenido debe respetar privacidad y propiedad intelectual.</p><p><b>Moderación.</b> CONECTA puede limitar, suspender o retirar contenido o cuentas ante incumplimientos o riesgos.</p><p><b>Premium.</b> Precio, renovación, cancelación y reembolsos se mostrarán de forma transparente antes de cualquier cobro.</p></div>`,
  },
};

const navLabels = ["Inicio", "Explorar", "Ahora", "Mapa", "Planes", "Grupos", "Chat", "Calendario"] as const;

function closePanel() { document.querySelector(".ac-overlay")?.remove(); }
function openPremium() { window.dispatchEvent(new CustomEvent("conecta:open-premium")); }

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

function cleanLegacy(sheet: HTMLElement, nav: HTMLElement) {
  sheet.classList.remove("conecta-premium-drawer");
  sheet.querySelectorAll(".conecta-drawer-intro,.conecta-control-center,.conecta-premium-mobile,.ac-premium-feature-card,.ac-main-nav,.ac-menu-section,.ac-logout,.ac-menu-footer").forEach((node) => node.remove());
  nav.removeAttribute("data-account-center");
}

function exactButton(buttons: HTMLButtonElement[], label: string) {
  return buttons.find((button) => button.textContent?.replace(/\s+/g, " ").trim() === label);
}

function proxyRow(icon: string, title: string, subtitle: string, action: () => void, tone = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ac-clean-row ${tone}`.trim();
  button.innerHTML = `<span class="ac-clean-icon">${icon}</span><span><strong>${title}</strong><small>${subtitle}</small></span><b>›</b>`;
  button.addEventListener("click", action);
  return button;
}

function group(title: string, rows: HTMLElement[]) {
  const section = document.createElement("section");
  section.className = "ac-clean-group";
  section.innerHTML = `<h3>${title}</h3>`;
  const body = document.createElement("div");
  rows.forEach((row) => body.appendChild(row));
  section.appendChild(body);
  return section;
}

function enhanceMenu() {
  document.querySelectorAll<HTMLElement>(".mobile-menu-sheet").forEach((sheet) => {
    const nav = sheet.querySelector<HTMLElement>(".mobile-menu-list");
    if (!nav || nav.dataset.cleanMenu === "1") return;

    cleanLegacy(sheet, nav);
    const nativeButtons = Array.from(nav.querySelectorAll<HTMLButtonElement>(":scope > button"));
    if (!nativeButtons.length) return;

    const native = (label: string) => exactButton(nativeButtons, label);
    const go = (label: string) => () => native(label)?.click();
    nativeButtons.forEach((button) => button.classList.add("ac-native-source"));

    nav.dataset.cleanMenu = "1";
    sheet.classList.add("ac-final-drawer");

    const shell = document.createElement("div");
    shell.className = "ac-final-shell";

    const premium = document.createElement("button");
    premium.type = "button";
    premium.className = "ac-premium-card-final";
    premium.innerHTML = `<div class="ac-premium-copy-final"><small>CONECTA PREMIUM</small><strong>Más planes. Más gente.<br>Más experiencias.</strong><span>Ventajas, ofertas y mayor visibilidad.</span><b>Descubrir Premium <i>›</i></b></div><em class="ac-price-final">4,99 €/mes</em><div class="ac-member-card" aria-hidden="true"><strong>CONECTA</strong><small>PREMIUM</small><span>MEMBER</span></div>`;
    premium.addEventListener("click", openPremium);
    shell.appendChild(premium);

    const main = document.createElement("section");
    main.className = "ac-clean-main";
    navLabels.forEach((label) => {
      const source = native(label);
      if (!source) return;
      const clone = source.cloneNode(true) as HTMLButtonElement;
      clone.removeAttribute("class");
      clone.className = `ac-clean-nav-row ${source.classList.contains("active") ? "active" : ""}`;
      clone.addEventListener("click", go(label));
      main.appendChild(clone);
    });
    shell.appendChild(main);

    shell.appendChild(group("TU CUENTA", [
      proxyRow("◯", "Mi perfil", "Datos, fotos y preferencias", go("Perfil"), "profile"),
      proxyRow("♡", "Conecta+", "Herramientas y experiencias especiales", go("Conecta+"), "connect"),
      proxyRow("◎", "Qué es CONECTA", "Cómo funciona y qué puedes hacer", () => openPanel("conecta"), "about"),
    ]));

    shell.appendChild(group("SEGURIDAD Y PRIVACIDAD", [
      proxyRow("◇", "Seguridad", "Verificación, bloqueos y control", go("Seguridad"), "security"),
      proxyRow("▢", "Privacidad", "Datos, ubicación y visibilidad", () => openPanel("privacy"), "privacy"),
      proxyRow("≡", "Tus derechos", "Acceso, descarga y eliminación", () => openPanel("rights"), "rights"),
    ]));

    shell.appendChild(group("SOPORTE Y LEGAL", [
      proxyRow("?", "Ayuda y soporte", "Centro de ayuda y contacto", () => openPanel("help"), "help"),
      proxyRow("▤", "Normas y condiciones", "Convivencia y uso responsable", () => openPanel("terms"), "terms"),
      proxyRow("✓", "Política de privacidad", "Cómo protegemos tus datos", () => openPanel("privacy"), "policy"),
    ]));

    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "ac-clean-logout";
    logout.innerHTML = `<span>↪</span><strong>Cerrar sesión</strong><b>›</b>`;
    logout.addEventListener("click", async () => { await supabase.auth.signOut(); window.location.reload(); });
    shell.appendChild(logout);

    const footer = document.createElement("div");
    footer.className = "ac-clean-footer";
    footer.innerHTML = `<b>CONECTA 1.0</b><span>Tu mundo, tu gente y tus planes.</span>`;
    shell.appendChild(footer);

    nav.appendChild(shell);
  });
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
