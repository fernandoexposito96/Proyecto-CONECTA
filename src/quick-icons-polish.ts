const quickIcons = [
  `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c4.4 0 8-3.4 8-7.8 0-3.2-1.7-5.7-4.5-8.2-.2 2-1.2 3.5-2.8 4.7.1-3.2-1.3-5.9-4.2-8.7.1 4-4.5 6.1-4.5 12.2C4 18.6 7.6 22 12 22Z"/><path d="M9.5 17.5c0 1.5 1.1 2.5 2.5 2.5s2.5-1 2.5-2.5c0-1.3-.7-2.3-2-3.5-.1 1-.6 1.8-1.4 2.3 0-1.3-.5-2.4-1.6-3.5.1 1.8-1.5 2.7-1.5 4.7Z"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3M8 17h3"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>`
];

function polishQuickIcons() {
  const items = Array.from(document.querySelectorAll<HTMLElement>(".ph-quick-row button"));
  if (!items.length) return;
  items.forEach((button, index) => {
    const icon = button.querySelector<HTMLElement>("i");
    if (!icon || icon.dataset.polished === "1") return;
    icon.dataset.polished = "1";
    icon.classList.add(`ph-quick-icon-${index + 1}`);
    icon.innerHTML = quickIcons[index] ?? quickIcons[0];
  });
}

let quickQueued = false;
const queueQuickPolish = () => {
  if (quickQueued) return;
  quickQueued = true;
  requestAnimationFrame(() => {
    quickQueued = false;
    polishQuickIcons();
  });
};

new MutationObserver(queueQuickPolish).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", queueQuickPolish);
queueQuickPolish();
