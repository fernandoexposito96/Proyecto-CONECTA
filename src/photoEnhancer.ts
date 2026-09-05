const localCardMedia = [
  `${import.meta.env.BASE_URL}media/cards/social-city.webp`,
  `${import.meta.env.BASE_URL}media/cards/active-coast.webp`,
  `${import.meta.env.BASE_URL}media/cards/creative-community.webp`,
  `${import.meta.env.BASE_URL}media/cards/safe-planning.webp`,
] as const;

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function pickPhoto(element: Element) {
  const seed = (element.textContent || element.getAttribute("aria-label") || "CONECTA").trim();
  return localCardMedia[hashText(seed) % localCardMedia.length];
}

function ensureInlinePhoto(element: Element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.querySelector(":scope > img, :scope picture, :scope .auto-content-photo")) return;
  const image = document.createElement("img");
  image.className = "auto-content-photo";
  image.src = pickPhoto(element);
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.setAttribute("aria-hidden", "true");
  element.prepend(image);
}

function ensureAvatarPhoto(element: Element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.querySelector("img, picture")) return;
  if (element.classList.contains("has-auto-photo")) return;
  element.classList.add("has-auto-photo");
  element.style.backgroundImage = `url("${pickPhoto(element.parentElement || element)}")`;
}

function enhancePhotos() {
  document
    .querySelectorAll(".map-results > button, .agenda-card > article, .recurring-row > article")
    .forEach(ensureInlinePhoto);

  document
    .querySelectorAll(".conversation-panel .conversation-avatar, .message-panel > header .conversation-avatar")
    .forEach(ensureAvatarPhoto);
}

function installStyles() {
  if (document.getElementById("conecta-photo-enhancer-styles")) return;
  const style = document.createElement("style");
  style.id = "conecta-photo-enhancer-styles";
  style.textContent = `
    .auto-content-photo {
      width: 54px;
      height: 54px;
      flex: 0 0 54px;
      object-fit: cover;
      border-radius: 16px;
      display: block;
      background: rgba(124, 58, 237, .08);
      box-shadow: 0 8px 22px rgba(20, 16, 35, .10);
    }

    .map-results > button .auto-content-photo {
      width: 48px;
      height: 48px;
      flex-basis: 48px;
      border-radius: 14px;
    }

    .agenda-card > article .auto-content-photo,
    .recurring-row > article .auto-content-photo {
      margin-right: 2px;
    }

    .conversation-avatar.has-auto-photo {
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
      overflow: hidden;
      color: transparent;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.45);
    }

    .conversation-avatar.has-auto-photo svg {
      opacity: 0;
    }

    @media (max-width: 640px) {
      .auto-content-photo {
        width: 46px;
        height: 46px;
        flex-basis: 46px;
        border-radius: 13px;
      }
      .map-results > button .auto-content-photo {
        width: 44px;
        height: 44px;
        flex-basis: 44px;
      }
    }
  `;
  document.head.appendChild(style);
}

export function startPhotoEnhancer() {
  installStyles();
  enhancePhotos();

  const observer = new MutationObserver(() => enhancePhotos());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
}
