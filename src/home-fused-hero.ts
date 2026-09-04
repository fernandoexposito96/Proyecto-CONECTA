export {};

const approvedHeroImage =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=92";

function applyApprovedHomeHero() {
  const root = document.querySelector<HTMLElement>(".premium-home-root");
  if (!root) return;

  const fused = root.querySelector<HTMLElement>(":scope > .ph-hero-fused");
  const hero = root.querySelector<HTMLElement>(":scope > .ph-hero") ?? fused?.querySelector<HTMLElement>(":scope > .ph-hero");
  if (!hero) return;

  // Si una versión anterior llegó a fusionar hero + mapa, restaura el hero como bloque independiente.
  if (fused) {
    fused.before(hero);
    fused.remove();
  }

  root.querySelector<HTMLElement>(":scope > .ph-map-card")?.remove();
  hero.querySelector<HTMLElement>(".ph-map-card")?.remove();
  hero.querySelector<HTMLElement>(".ph-hero-pills")?.remove();

  hero.classList.add("ph-hero-approved");

  const greeting = hero.querySelector<HTMLElement>(".ph-hero-copy > p");
  if (greeting) greeting.textContent = "¡Buenos días, Fernando! 👋";

  const title = hero.querySelector<HTMLElement>(".ph-hero-copy h1");
  if (title) title.innerHTML = "Descubre<br/>planes cerca<br/>de ti";

  const subtitle = hero.querySelector<HTMLElement>(".ph-hero-sub");
  if (subtitle) subtitle.innerHTML = "Conecta con personas increíbles<br/>y vive experiencias únicas";

  const image = hero.querySelector<HTMLImageElement>(".ph-hero-photo img");
  if (image) {
    image.src = approvedHeroImage;
    image.alt = "Grupo de amigos disfrutando juntos de un plan";
  }
}

let queued = false;
const queueApprovedHero = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    applyApprovedHomeHero();
  });
};

new MutationObserver(queueApprovedHero).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueApprovedHero);
window.addEventListener("pageshow", queueApprovedHero);
queueApprovedHero();
