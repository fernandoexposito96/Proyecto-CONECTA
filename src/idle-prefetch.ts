type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

type WindowWithIdle = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const prefetchHeavyViews = () => {
  const connection = (navigator as NavigatorWithConnection).connection;
  if (connection?.saveData || connection?.effectiveType === "2g") return;

  void Promise.allSettled([
    import("./views/AdvancedChatView"),
    import("./views/SecurityView"),
    import("./views/ProductHub"),
    import("./views/StatusViews"),
    import("./views/CommunityActivityTools"),
  ]);
};

export function scheduleIdlePrefetch() {
  if (!import.meta.env.PROD) return;

  const start = () => {
    const idleWindow = window as WindowWithIdle;
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(prefetchHeavyViews, { timeout: 4_000 });
      return;
    }
    window.setTimeout(prefetchHeavyViews, 1_500);
  };

  // El splash dura 5 s: la precarga empieza después para no competir con el arranque.
  window.setTimeout(start, 5_500);
}
