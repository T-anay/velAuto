export default function StatCard({ title, value, colorClass }) {
    return (
        <div className={`bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border-t-4 ${colorClass} transition-transform hover:scale-[1.02]`}>
            <h3 className="text-gray-400 font-medium mb-2 uppercase text-sm tracking-wider">{title}</h3>
            <h1 className="text-5xl font-black text-[var(--text-primary)]">{value}</h1>
        </div>
    );
}