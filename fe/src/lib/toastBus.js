const listeners = new Set();
let toasts = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener(toasts));
};

export const pushToast = ({
  type = 'info',
  title = '',
  message = '',
  duration = 3200,
}) => {
  const toast = {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    title,
    message,
    duration,
    createdAt: new Date().toISOString(),
  };

  toasts = [toast, ...toasts].slice(0, 5);
  notifyListeners();
  return toast.id;
};

export const dismissToast = (toastId) => {
  toasts = toasts.filter((toast) => toast.id !== toastId);
  notifyListeners();
};

export const subscribeToasts = (listener) => {
  listeners.add(listener);
  listener(toasts);

  return () => {
    listeners.delete(listener);
  };
};
