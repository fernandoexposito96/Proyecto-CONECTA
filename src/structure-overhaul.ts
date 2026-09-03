const ACCENTS = [
  { name: "Violeta", value: "#7657f6" },
  { name: "Azul", value: "#3478f6" },
  { name: "Coral", value: "#f06a65" },
  { name: "Verde", value: "#27a56b" },
  { name: "Rosa", value: "#d64f8d" },
] as const;

type Density = "comfortable" | "compact";

function applyPreferences() {
  const accent = window.localStorage.getItem("conecta-accent") || ACCENTS[0].value;
  const density = (window.localStorage.getItem("conecta-density") as Density | null) || "comfortable";
  document.documentElement.style.setProperty("--conecta-accent", accent);
  document.documentElement.dataset.density = density;
}

function clickMenuButton(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".mobile-menu-list button"));
  const target = buttons.find((button) => button.textContent?.trim().toLowerCase() === label.toLowerCase());
  target?.click();
}

function icon(glyph: string) {
  const span = document.createElement("span");
  span.className = "conecta-control-button__icon";
  span.setAttribute("aria-hidden", "true");
  span.textContent = glyph;
  return span;
}

function controlButton(title: string, subtitle: string, glyph: string, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "conecta-control-button";
  button.append(icon(glyph));
  const copy = document.createElement("span");
  copy.className = "conecta-control-button__copy";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = subtitle;
  copy.append(strong, small);
  button.append(copy);
  button.addEventListener("click", onClick);
  return button;
}

function section(title: string) {
  const wrapper = document.createElement("section");
  wrapper.className = "conecta-control-center__section";
  const heading = document.createElement("p");
  heading.className = "conecta-control-center__title";
  heading.textContent = title;
  wrapper.append(heading);
  return wrapper;
}

function buildControlCenter(sheet: HTMLElement) {
  if (sheet.querySelector(".conecta-control-center")) return;

  const root = document.createElement("div");
  root.className = "conecta-control-center";

  const account = section("Cuenta y privacidad");
  const accountGrid = document.createElement("div");
  accountGrid.className = "conecta-control-grid";
  accountGrid.append(
    controlButton("Mi perfil", "Datos, bio y preferencias", "👤", () => clickMenuButton("Perfil")),
    controlButton("Privacidad", "Seguridad, permisos y cuenta", "🔐", () => clickMenuButton("Seguridad")),
    controlButton("Notificaciones", "Avisos y actividad reciente", "🔔", () => {
      const close = sheet.querySelector<HTMLButtonElement>("button[data-radix-dialog-close]");
      close?.click();
      setTimeout(() => document.querySelector<HTMLButtonElement>('.top-actions button[aria-label="Notificaciones"]')?.click(), 80);
    }),
    controlButton("Calendario", "Planes confirmados y agenda", "📅", () => clickMenuButton("Calendario")),
  );
  account.append(accountGrid);

  const appearance = section("Apariencia");
  const themeCard = document.createElement("div");
  themeCard.className = "conecta-theme-card";
  const themeHead = document.createElement("div");
  themeHead.className = "conecta-theme-card__head";
  const themeTitle = document.createElement("strong");
  themeTitle.textContent = "Tema y color de CONECTA";
  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.className = "conecta-theme-toggle";
  const syncThemeLabel = () => { themeToggle.textContent = document.documentElement.dataset.theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"; };
  syncThemeLabel();
  themeToggle.addEventListener("click", () => {
    document.querySelector<HTMLButtonElement>(".theme-button")?.click();
    setTimeout(syncThemeLabel, 0);
  });
  themeHead.append(themeTitle, themeToggle);

  const colorPicker = document.createElement("div");
  colorPicker.className = "conecta-color-picker";
  const currentAccent = window.localStorage.getItem("conecta-accent") || ACCENTS[0].value;
  for (const accent of ACCENTS) {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "conecta-color-swatch";
    swatch.title = accent.name;
    swatch.setAttribute("aria-label", `Color ${accent.name}`);
    swatch.style.background = accent.value;
    swatch.style.color = accent.value;
    swatch.setAttribute("aria-pressed", String(accent.value === currentAccent));
    swatch.addEventListener("click", () => {
      window.localStorage.setItem("conecta-accent", accent.value);
      document.documentElement.style.setProperty("--conecta-accent", accent.value);
      colorPicker.querySelectorAll("button").forEach((node) => node.setAttribute("aria-pressed", "false"));
      swatch.setAttribute("aria-pressed", "true");
    });
    colorPicker.append(swatch);
  }

  const density = document.createElement("div");
  density.className = "conecta-density-toggle";
  const comfortable = document.createElement("button");
  const compact = document.createElement("button");
  comfortable.type = compact.type = "button";
  comfortable.textContent = "Cómodo";
  compact.textContent = "Compacto";
  const syncDensity = () => {
    const selected = document.documentElement.dataset.density || "comfortable";
    comfortable.classList.toggle("active", selected === "comfortable");
    compact.classList.toggle("active", selected === "compact");
  };
  const setDensity = (value: Density) => {
    window.localStorage.setItem("conecta-density", value);
    document.documentElement.dataset.density = value;
    syncDensity();
  };
  comfortable.addEventListener("click", () => setDensity("comfortable"));
  compact.addEventListener("click", () => setDensity("compact"));
  density.append(comfortable, compact);
  syncDensity();

  themeCard.append(themeHead, colorPicker, density);
  appearance.append(themeCard);

  const quick = section("Accesos rápidos");
  const quickGrid = document.createElement("div");
  quickGrid.className = "conecta-control-grid";
  quickGrid.append(
    controlButton("Explorar", "Buscar planes y personas", "🧭", () => clickMenuButton("Explorar")),
    controlButton("Mapa", "Planes cerca de ti", "🗺️", () => clickMenuButton("Mapa")),
    controlButton("Grupos", "Comunidades y actividades", "👥", () => clickMenuButton("Grupos")),
    controlButton("Chat", "Conversaciones", "💬", () => clickMenuButton("Chat")),
  );
  quick.append(quickGrid);

  root.append(account, appearance, quick);
  const demo = sheet.querySelector(".mobile-demo-control");
  if (demo) sheet.insertBefore(root, demo);
  else sheet.append(root);
}

function enhance() {
  document.querySelectorAll<HTMLElement>(".mobile-menu-sheet").forEach(buildControlCenter);
}

applyPreferences();
const observer = new MutationObserver(enhance);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener("DOMContentLoaded", enhance, { once: true });
setTimeout(enhance, 0);
