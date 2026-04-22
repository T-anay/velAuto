import { useEffect, useRef, useState } from 'react';
import { dismissToast, subscribeToasts } from '../lib/toastBus';

const TYPE_STYLES = {
  success: {
    backgroundColor: 'var(--toast-success-bg)',
    borderColor: 'var(--toast-success-border)',
  },
  error: {
    backgroundColor: 'var(--toast-error-bg)',
    borderColor: 'var(--toast-error-border)',
  },
  warning: {
    backgroundColor: 'var(--toast-warning-bg)',
    borderColor: 'var(--toast-warning-border)',
  },
  info: {
    backgroundColor: 'var(--toast-info-bg)',
    borderColor: 'var(--toast-info-border)',
  },
};

const TYPE_BADGES = {
  success: 'Başarılı',
  error: 'Hata',
  warning: 'Uyarı',
  info: 'Bilgi',
};

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => subscribeToasts(setToasts), []);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timersRef.current.has(toast.id)) return;

      const timeoutId = window.setTimeout(() => {
        dismissToast(toast.id);
        timersRef.current.delete(toast.id);
      }, toast.duration || 3200);

      timersRef.current.set(toast.id, timeoutId);
    });

    timersRef.current.forEach((timeoutId, toastId) => {
      if (!toasts.some((toast) => toast.id === toastId)) {
        window.clearTimeout(timeoutId);
        timersRef.current.delete(toastId);
      }
    });

    return () => {
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, [toasts]);

  return (
    <div className="fixed top-5 right-5 z-[100] flex w-[min(100vw-2rem,420px)] flex-col gap-3">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className="rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-300"
          style={{
            ...(TYPE_STYLES[toast.type] || TYPE_STYLES.info),
            color: 'var(--toast-text)',
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.35em] font-black" style={{ color: 'var(--toast-muted)' }}>
                {TYPE_BADGES[toast.type] || TYPE_BADGES.info}
              </p>
              {toast.title && <h3 className="mt-1 text-sm font-black">{toast.title}</h3>}
              {toast.message && <p className="mt-1 text-sm leading-6">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-lg border px-2 py-1 text-xs font-black uppercase tracking-widest transition-colors"
              style={{
                borderColor: 'var(--toast-close-border)',
                backgroundColor: 'var(--toast-close-bg)',
                color: 'var(--toast-text)',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = 'var(--toast-close-bg-hover)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'var(--toast-close-bg)';
              }}
              aria-label="Bildirimi kapat"
            >
              Kapat
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
