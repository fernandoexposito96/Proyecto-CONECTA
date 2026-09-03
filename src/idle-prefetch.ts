type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

type WindowWithIdle = Window & {
  requestIdleCallback?: (
    callback: (deadline: { timeRemaining: () => number; didTimeout: boolean }) => void,
    options?: { timeout: number },
  ) => number;
};

const heavyViewLoaders = [
  () => import("./views/AdvancedChatView"),
  () => import("./views/SecurityView"),
  () => import("./views/ProductHub"),
  () => import("./views/StatusViews"),
  () => import("./views/CommunityActivityTools"),
] as const;

function shouldPrefetch() {
  const connection = (navigator as NavigatorWithConnection).connection;
  if (document.visibilityState !== "visible") return false;
  if (connection?.saveData) return false;
  if (["slow-2g", "2g"].includes(connection?.effectiveType ?? "")) return false;
  return true;
}

export function scheduleIdlePrefetch() {
  if (!import.meta.env.PROD) return;

  let index = 0;
  let stopped = false;
  const idleWindow = window as WindowWithIdle;

  const scheduleNext = () => {
    if (stopped || index >= heavyViewLoaders.length || !shouldPrefetch()) return;

    const runOne = async () => {
      if (stopped || !shouldPrefetch()) return;
      const loader = heavyViewLoaders[index++];
      try {
        await loader();
      } catch {
        // La vista seguirá cargándose normalmente cuando el usuario la abra.
      }
      if (!stopped) window.setTimeout(scheduleNext, 450);
    };

    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(
        (deadline) => {
          if (deadline.didTimeout || deadline.timeRemaining() >= 6) void runOne();
          else window.setTimeout(scheduleNext, 300);
        },
        { timeout: 3_000 },
      );
      return;
    }

    window.setTimeout(() => void runOne(), 750);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && !stopped) scheduleNext();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  // El splash dura 5 s. Dejamos respirar al primer render antes de precargar.
  const starter = window.setTimeout(scheduleNext, 5_800);

  // La cola termina sola cuando todos los módulos están preparados.
  const cleanup = window.setInterval(() => {
    if (index < heavyViewLoaders.length) return;
    stopped = true;
    window.clearInterval(cleanup);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }, 2_000);

  window.addEventListener(
    "pagehide",
    () => {
      stopped = true;
      window.clearTimeout(starter);
      window.clearInterval(cleanup);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
    { once: true },
  );
}
