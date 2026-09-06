const UX_STATE_KEY = 'conecta-ux-actions-v1';

type ActionState = Record<string, 'liked' | 'favorite' | 'dismissed'>;

function loadActionState(): ActionState {
  try { return JSON.parse(localStorage.getItem(UX_STATE_KEY) || '{}') as ActionState; }
  catch { return {}; }
}

function saveActionState(state: ActionState) {
  localStorage.setItem(UX_STATE_KEY, JSON.stringify(state));
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9áéíóúüñ-]/gi, '');
}

function ensureAvatarFallbacks(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('img.profile-avatar').forEach((img) => {
    const fallback = document.querySelector<HTMLImageElement>('.top-actions img')?.src ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=90';
    const useFallback = () => {
      if (img.src !== fallback) img.src = fallback;
      img.classList.add('avatar-loaded');
    };
    if (!img.dataset.fallbackBound) {
      img.dataset.fallbackBound = '1';
      img.addEventListener('error', useFallback, { once: true });
      img.addEventListener('load', () => img.classList.add('avatar-loaded'));
    }
    if (img.complete && img.naturalWidth === 0) useFallback();
    if (img.complete && img.naturalWidth > 0) img.classList.add('avatar-loaded');
  });
}

function updatePrivacyScore(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.settings-security-score').forEach((score) => {
    const container = score.parentElement;
    if (!container) return;
    const recommended = [...container.querySelectorAll<HTMLElement>('.switch-row')]
      .filter((row) => row.querySelector('small')?.textContent?.includes('Recomendado por CONECTA'));
    if (!recommended.length) return;
    const active = recommended.filter((row) => row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).length;
    const total = recommended.length;
    const pct = Math.round((active / total) * 100);
    const label = score.querySelector('span');
    const number = score.querySelector(':scope > b');
    const status = score.querySelector('strong');
    if (label) label.textContent = `${active} de ${total} controles recomendados activos`;
    if (number) number.textContent = String(pct);
    if (status) status.textContent = pct === 100 ? 'Excelente' : pct >= 75 ? 'Muy buena' : pct >= 50 ? 'Buena' : 'Mejorable';
    recommended.forEach((row) => {
      const input = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (input && !input.dataset.scoreBound) {
        input.dataset.scoreBound = '1';
        input.addEventListener('change', () => updatePrivacyScore(document));
      }
    });
  });
}

function enhancePlanLikes(root: ParentNode = document) {
  const state = loadActionState();
  root.querySelectorAll<HTMLElement>('.plan-card').forEach((card) => {
    const title = card.querySelector('h3')?.textContent || 'plan';
    const key = `plan:${slug(title)}`;
    const button = card.querySelector<HTMLButtonElement>('.plan-image > button');
    if (!button) return;
    button.type = 'button';
    button.setAttribute('aria-label', 'Me gusta');
    button.title = 'Me gusta';
    button.classList.toggle('is-liked', state[key] === 'liked');
    if (!button.dataset.likeBound) {
      button.dataset.likeBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const current = loadActionState();
        if (current[key] === 'liked') delete current[key]; else current[key] = 'liked';
        saveActionState(current);
        button.classList.toggle('is-liked', current[key] === 'liked');
      });
    }
  });
}

function enhancePeopleActions(root: ParentNode = document) {
  const state = loadActionState();
  root.querySelectorAll<HTMLElement>('.people-strip article').forEach((card) => {
    const name = card.querySelector('strong')?.textContent || 'persona';
    const key = `person:${slug(name)}`;
    let actions = card.querySelector<HTMLElement>('.person-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'person-actions';
      actions.innerHTML = `
        <button type="button" data-action="dismissed" aria-label="Descartar" title="Descartar">×</button>
        <button type="button" data-action="favorite" aria-label="Favorito" title="Favorito">★</button>
        <button type="button" data-action="liked" aria-label="Me gusta" title="Me gusta">♥</button>`;
      card.appendChild(actions);
    }
    actions.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
      const action = button.dataset.action as ActionState[string];
      button.classList.toggle('active', state[key] === action);
      if (!button.dataset.actionBound) {
        button.dataset.actionBound = '1';
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const current = loadActionState();
          if (current[key] === action) delete current[key]; else current[key] = action;
          saveActionState(current);
          actions?.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((b) => b.classList.toggle('active', b.dataset.action === current[key]));
          card.classList.toggle('is-dismissed', current[key] === 'dismissed');
        });
      }
    });
    card.classList.toggle('is-dismissed', state[key] === 'dismissed');
  });
}

function applyUxFixes(root: ParentNode = document) {
  ensureAvatarFallbacks(root);
  updatePrivacyScore(root);
  enhancePlanLikes(root);
  enhancePeopleActions(root);
}

applyUxFixes();

const observer = new MutationObserver(() => applyUxFixes(document));
observer.observe(document.body, { childList: true, subtree: true });
