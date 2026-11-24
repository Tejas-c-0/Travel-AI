export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(
  title: string,
  subtitle = "",
  type: ToastType = "info",
  action?: { label: string; onClick: () => void }
) {
  const msg: ToastMessage = {
    id: "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    title,
    subtitle,
    type,
    actionLabel: action?.label,
    onAction: action?.onClick,
  };
  listeners.forEach((fn) => fn(msg));
}

export function subscribeToast(fn: ToastListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
