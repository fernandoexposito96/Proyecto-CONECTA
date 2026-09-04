const PLAN_CARD_SELECTOR = ".plan-card";
const PLAN_CTA_SELECTOR = ".plan-card .join-plan";

function decoratePlanCards() {
  document.querySelectorAll<HTMLElement>(PLAN_CARD_SELECTOR).forEach((card) => {
    card.dataset.premiumPlanCard = "true";

    const cta = card.querySelector<HTMLButtonElement>(".join-plan");
    if (!cta) return;

    cta.dataset.premiumPlanCta = "true";
    cta.setAttribute("aria-label", "Ver detalles del plan");
    cta.setAttribute("title", "Ver detalles del plan");

    if (cta.textContent?.trim() !== "Ver plan") {
      cta.replaceChildren(document.createTextNode("Ver plan"));
    }
  });

  document.querySelectorAll<HTMLElement>(".plan-detail-dialog").forEach((detail) => {
    detail.dataset.premiumPlanDetail = "true";
  });
}

function openPlanFromCard(card: HTMLElement) {
  const opener = card.querySelector<HTMLElement>(".plan-title") ?? card.querySelector<HTMLElement>(".plan-image");
  opener?.click();
}

export function startPlanPremiumEnhancer() {
  decoratePlanCards();

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const cta = target.closest<HTMLButtonElement>(PLAN_CTA_SELECTOR);
      if (!cta) return;

      const card = cta.closest<HTMLElement>(PLAN_CARD_SELECTOR);
      if (!card) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openPlanFromCard(card);
    },
    true,
  );

  const observer = new MutationObserver(() => decoratePlanCards());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

startPlanPremiumEnhancer();
