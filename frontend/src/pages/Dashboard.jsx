const cards = [
  { label: "Nurses", value: "0", color: "text-[#0F766E]" },
  { label: "Residents", value: "0", color: "text-[#0F766E]" },
  { label: "Critical today", value: "0", color: "text-[#DC2626]" },
  { label: "Pending complaints", value: "0", color: "text-[#F59E0B]" },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-600 text-lg">{card.label}</p>
            <p className={`text-5xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mt-6">
        <h2 className="text-xl font-semibold text-[#0F172A]">Nurse performance today</h2>
        <p className="text-slate-500 mt-2">Scores will appear here once nurses start logging doses.</p>
      </div>
    </div>
  );
}