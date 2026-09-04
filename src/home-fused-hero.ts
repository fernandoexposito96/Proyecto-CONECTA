export {};

function fuseHomeHero() {
  const root = document.querySelector<HTMLElement>(".premium-home-root");
  if (!root) return;

  const hero = root.querySelector<HTMLElement>(":scope > .ph-hero");
  const map = root.querySelector<HTMLElement>(":scope > .ph-map-card");
  const existing = root.querySelector<HTMLElement>(":scope > .ph-hero-fused");

  if (existing) return;
  if (!hero || !map) return;

  const title = hero.querySelector<HTMLElement>(".ph-hero-copy h1");
  if (title) title.innerHTML = "Descubre<br/>planes cerca<br/>de ti";

  const pills = hero.querySelector<HTMLElement>(".ph-hero-pills");

  const fused = document.createElement("section");
  fused.className = "ph-hero-fused";
  hero.before(fused);
  fused.append(hero, map);

  // Los chips deben pertenecer al bloque fusionado, no al bloque de texto.
  // Así se posicionan sobre el mapa y nunca vuelven a tapar el título/subtítulo.
  if (pills) fused.append(pills);
}

let homeFuseQueued = false;
const queueHomeFuse = () => {
  if (homeFuseQueued) return;
  homeFuseQueued = true;
  requestAnimationFrame(() => {
    homeFuseQueued = false;
    fuseHomeHero();
  });
};

new MutationObserver(queueHomeFuse).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueHomeFuse);
window.addEventListener("pageshow", queueHomeFuse);
queueHomeFuse();