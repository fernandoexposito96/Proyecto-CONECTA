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
  if (root instanceof HTMLElement && STALE_SELECTORS.some((selector) => root.matches(selector))) {
    root.remove();
    return;
  }
  STALE_SELECTORS.forEach((selector) => {
    root.querySelectorAll?.<HTMLElement>(selector).forEach((node) => node.remove());
  });
}

function optimizeImages(root: ParentNode = document) {
  const images: HTMLImageElement[] = [];
  if (root instanceof HTMLImageElement) images.push(root);
  root.querySelectorAll?.<HTMLImageElement>('img').forEach((img) => images.push(img));
  images.forEach((img) => {
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

const observer = new MutationObserver((mutations) => {
  const roots = new Set<ParentNode>();
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement || node instanceof DocumentFragment) roots.add(node);
    });
  }
  if (!roots.size) return;
  requestAnimationFrame(() => roots.forEach((root) => applyStability(root)));
});
observer.observe(document.body, { childList: true, subtree: true });
