const media = (file: string) => `${import.meta.env.BASE_URL}media/cards/${file}`;

const imagePool = {
  default: media("social-city.webp"),
  active: media("active-coast.webp"),
  creative: media("creative-community.webp"),
  safe: media("safe-planning.webp"),
} as const;

function imageForText(value: string) {
  const text = value.toLowerCase();
  if (/running|correr|sender|bici|cicl|gimnas|pádel|padel|entren|deporte/.test(text)) return imagePool.active;
  if (/cultura|música|musica|concierto|lectura|libro|juego|idioma|arte/.test(text)) return imagePool.creative;
  if (/segur|verific|privacidad|ayuda|punto de encuentro/.test(text)) return imagePool.safe;
  return imagePool.default;
}

function addImage(target: HTMLElement, className: string) {
  if (target.querySelector(`:scope > img.${className}`)) return;
  const image = document.createElement("img");
  image.className = className;
  image.src = imageForText(target.textContent || "");
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.setAttribute("aria-hidden", "true");
  target.prepend(image);
}

function coverCompactContent(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".map-results > button").forEach((item) => addImage(item, "content-row-image"));
  root.querySelectorAll<HTMLElement>(".agenda-card > article").forEach((item) => addImage(item, "content-row-image"));
  root.querySelectorAll<HTMLElement>(".recurring-row > article").forEach((item) => addImage(item, "content-row-image"));
}

export function startContentImageCoverage() {
  coverCompactContent();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches(".map-results > button, .agenda-card > article, .recurring-row > article")) {
          coverCompactContent(node.parentElement ?? document);
        } else if (node.querySelector(".map-results > button, .agenda-card > article, .recurring-row > article")) {
          coverCompactContent(node);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
