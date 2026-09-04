export const TOAST_EVENT = "conecta:toast";

export type ToastDetail = { message: string; tone: "success" | "error" | "info" };

function emit(message: string, tone: ToastDetail["tone"]) {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, tone } }));
}

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
};
