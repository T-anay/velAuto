import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useService } from '../context/ServiceContext';
import { useTheme } from '../context/ThemeContext';
import { pushToast } from '../lib/toastBus';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useService();
    const { isDark, toggleTheme } = useTheme();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        const response = await login(credentials);
        if (!response.success) {
            setError(response.message);
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        pushToast({ type: 'success', title: 'Giriş başarılı', message: `Hoş geldiniz, ${response.user.fullName || response.user.email}!` });
        navigate('/dashboard');
    };

    return (
        <div className="w-full max-w-md relative">
            <button
                type="button"
                onClick={toggleTheme}
                className="absolute right-0 -top-14 h-11 w-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:brightness-110 transition-all"
                title={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
                aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            >
                {isDark ? '☀️' : '🌙'}
            </button>

            <form onSubmit={handleSubmit} className="w-full bg-[var(--bg-card)] p-10 rounded-3xl shadow-2xl text-center border border-[var(--border-soft)] animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur">
                <div className="mb-10">
                    <h1 className="text-[var(--accent)] text-4xl font-black mb-3 tracking-[0.3em] uppercase">velAuto</h1>
                    <p className="text-gray-400 font-medium">Şimdilik demo giriş açık, sonradan doğrulama eklenecek</p>
                </div>

                <div className="space-y-4 text-left">
                    <input
                        value={credentials.email}
                        onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                        type="email"
                        placeholder="E-posta adresi"
                        className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all placeholder:text-gray-500"
                    />
                    <input
                        value={credentials.password}
                        onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                        type="password"
                        placeholder="Şifre"
                        className="w-full p-4 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all placeholder:text-gray-500"
                    />

                    {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-4 p-4 bg-[var(--accent)] text-white font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-[0.2em] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'GİRİŞ YAPILIYOR...' : 'SİSTEME GİRİŞ YAP'}
                    </button>
                </div>

            </form>
        </div>
    );
}