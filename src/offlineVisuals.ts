export function offlineVisual(seed = "conecta") {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const hueA = Math.abs(hash) % 360;
  const hueB = (hueA + 44 + (Math.abs(hash >> 8) % 72)) % 360;
  const x = 18 + (Math.abs(hash >> 12) % 64);
  const y = 18 + (Math.abs(hash >> 18) % 54);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hueA} 76% 46%)"/><stop offset="1" stop-color="hsl(${hueB} 82% 34%)"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="34"/></filter></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="${x * 12}" cy="${y * 8}" r="210" fill="rgba(255,255,255,.18)" filter="url(#b)"/><circle cx="${(100 - x) * 12}" cy="${(90 - y) * 8}" r="170" fill="rgba(255,255,255,.12)"/><path d="M0 610 C220 500 360 720 600 590 S980 470 1200 610 V800 H0Z" fill="rgba(9,7,18,.28)"/><g fill="rgba(255,255,255,.92)"><circle cx="505" cy="376" r="54"/><circle cx="695" cy="376" r="54"/><path d="M408 565c18-104 82-160 156-160 69 0 128 51 150 140l-78 19c-13-52-41-78-77-78-39 0-67 30-76 88z"/><path d="M593 563c19-101 79-154 151-154 65 0 121 46 146 128l-75 23c-14-48-40-72-75-72-36 0-64 28-72 84z"/></g><text x="600" y="700" text-anchor="middle" fill="rgba(255,255,255,.9)" font-family="system-ui,-apple-system,sans-serif" font-size="34" font-weight="800" letter-spacing="5">CONECTA</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
