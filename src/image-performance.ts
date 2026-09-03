const CRITICAL_IMAGE_SELECTOR = [
  ".hero-card img",
  ".profile-hero img",
  ".auth-shell img",
  ".loading-screen img",
].join(",");

function tuneImage(image: HTMLImageElement) {
  if (image.dataset.conectaImageTuned === "1") return;
  image.dataset.conectaImageTuned = "1";

  image.decoding = "async";
  if (image.matches(CRITICAL_IMAGE_SELECTOR)) {
    image.loading = "eager";
    if ("fetchPriority" in image) image.fetchPriority = "high";
    return;
  }

  image.loading = "lazy";
  if ("fetchPriority" in image) image.fetchPriority = "low";
}

function tuneTree(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>("img").forEach(tuneImage);
}

export function startImagePerformance() {
  tuneTree(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLImageElement) tuneImage(node);
        tuneTree(node);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
}
