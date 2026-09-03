const viewImages = {
  explorar: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88",
  conectar: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=88",
  chat: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=88",
};

const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=86",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=86",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=86",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=86",
];

function normalise(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function detectView(page: HTMLElement): keyof typeof viewImages | null {
  if (page.classList.contains("product-hub")) return "conectar";
  if (page.classList.contains("chat-page") || page.querySelector(".chat-layout")) return "chat";
  if (page.querySelector(".filter-layout") && page.querySelector(".explore-results")) return "explorar";

  const title = normalise(page.querySelector(".page-hero h1")?.textContent || "");
  if (title.includes("chat") || title.includes("mensaj")) return "chat";
  if (title.includes("confianza") || title.includes("conecta+")) return "conectar";
  if (title.includes("planes") && title.includes("personas")) return "explorar";
  return null;
}

function premiumiseHero(page: HTMLElement) {
  const hero = page.querySelector<HTMLElement>(".page-hero");
  if (!hero) return;
  const key = detectView(page);
  if (!key) return;

  page.dataset.premiumView = key;
  const previous = hero.querySelector<HTMLElement>(".cx-view-visual");
  if (previous) {
    previous.dataset.view = key;
    const image = previous.querySelector<HTMLImageElement>("img");
    if (image) image.src = viewImages[key];
    return;
  }

  const visual = document.createElement("div");
  visual.className = "cx-view-visual";
  visual.dataset.view = key;
  visual.innerHTML = `<img src="${viewImages[key]}" alt=""/><span>${key === "explorar" ? "Descubre algo nuevo hoy" : key === "conectar" ? "Más confianza para quedar" : "Tus conversaciones, más cerca"}</span>`;
  hero.appendChild(visual);
}

function premiumiseChat(page: HTMLElement) {
  const chat = page.querySelector<HTMLElement>(".chat-layout");
  if (!chat) return;
  page.dataset.premiumView = "chat";
  const panel = chat.querySelector<HTMLElement>(".conversation-panel");
  panel?.querySelectorAll<HTMLButtonElement>("button").forEach((button, index) => {
    if (button.querySelector(".cx-chat-avatar")) return;
    const img = document.createElement("img");
    img.className = "cx-chat-avatar";
    img.src = avatars[index % avatars.length];
    img.alt = "";
    button.prepend(img);
  });

  if (!chat.previousElementSibling?.classList.contains("cx-chat-feature")) {
    const feature = document.createElement("section");
    feature.className = "cx-chat-feature";
    feature.innerHTML = `<div><span>MENSAJES</span><h2>Habla, organiza y queda</h2><p>Conversaciones claras, planes compartidos y todo a mano.</p></div><img src="${viewImages.chat}" alt="Amigos conversando"/>`;
    chat.before(feature);
  }
}

function premiumisePeople(page: HTMLElement) {
  if (page.dataset.premiumView !== "conectar") return;
  page.querySelectorAll<HTMLElement>(".people-list article").forEach((card, index) => {
    if (card.querySelector("img")) return;
    const img = document.createElement("img");
    img.src = avatars[index % avatars.length];
    img.alt = "";
    card.prepend(img);
  });
}

function syncSecondaryViews() {
  document.querySelectorAll<HTMLElement>(".view-page").forEach((page) => {
    const key = detectView(page);
    if (!key) {
      delete page.dataset.premiumView;
      return;
    }
    page.dataset.premiumView = key;
    premiumiseHero(page);
    premiumiseChat(page);
    premiumisePeople(page);
  });
}

let queued = false;
const queue = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    syncSecondaryViews();
  });
};

new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queue);
window.addEventListener("pageshow", queue);
queue();