export {};

const STALE_SELECTORS = [
  '.icebreaker-card',
  '.week-dashboard',
  '.retention-reminder',
  '.conecta-map-card',
  '.profile-video-card',
  '.conecta-access-card',
  '.friendship-timeline',
  '.selfie-verify',
  '.plan-extras',
  '.wrapped-modal'
];

function removeStaleOptionalUi(root: ParentNode = document) {
  STALE_SELECTORS.forEach((selector) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((node) => node.remove());
  });
}

function optimizeImages(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.decoding = 'async';
    const isPriority = !!img.closest('.hero,.top-actions,.profile-head,.detail-photo');
    img.loading = isPriority ? 'eager' : 'lazy';
    if (!img.dataset.stabilityImageBound) {
      img.dataset.stabilityImageBound = '1';
      img.addEventListener('load', () => img.classList.add('image-ready'));
      img.addEventListener('error', () => img.classList.add('image-failed'));
    }
    if (img.complete && img.naturalWidth > 0) img.classList.add('image-ready');
    if (img.complete && img.naturalWidth === 0) img.classList.add('image-failed');
  });
}

function applyStability(root: ParentNode = document) {
  removeStaleOptionalUi(root);
  optimizeImages(root);
}

applyStability();

let queued = false;
const observer = new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    applyStability(document);
  });
});
observer.observe(document.body, { childList: true, subtree: true });
