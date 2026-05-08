import { useNavigate } from 'react-router-dom';

export default function BackButton({ to = '/dashboard', label = 'Geri Don' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-2 text-sm font-black text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
