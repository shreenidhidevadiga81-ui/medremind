import { useEffect, useState } from "react";
import { getDashboard } from "../api";

function StatCard({ label, value, tone = "teal" }) {
  const tones = {
    teal: "text-[#0F766E]",
    green: "text-[#16A34A]",
    amber: "text-amber-600",
    red: "text-[#DC2626]",
  };
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-slate-500 text-lg">{label}</p>
      <p className={`text-4xl font-bold mt-2 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function ScoreBadge({ score, color }) {
  if (score === null || score === undefined) {
    return <span className="text-slate-400">No doses yet</span>;
  }
  const styles = {
    green: "bg-green-100 text-[#16A34A]",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-[#DC2626]",
  };
  return (
    <span className={`rounded-full px-4 py-1 text-lg font-bold ${styles[color]}`}>
      {score} / 10
    </span>
  );
}

function formatTime(iso) {
  // the server sends UTC time without a "Z", so we add it before converting
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setData(await getDashboard(token));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Dashboard</h1>
        <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500 text-lg">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0F172A]">Dashboard</h1>
        <button
          onClick={load}
          className="rounded-lg bg-[#0F766E] hover:bg-[#115e59] text-white font-semibold px-5 py-2 text-lg"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Residents" value={data.total_residents} />
        <StatCard label="Nurses" value={data.total_nurses} />
        <StatCard label="Doses given today" value={`${data.doses_today.given} / ${data.doses_today.total}`} tone="green" />
        <StatCard label="Pending doses" value={data.doses_today.pending} tone="amber" />
      </div>

      {data.critical_alerts.length > 0 && (
        <div className="rounded-2xl border-2 border-[#DC2626] bg-red-50 p-6">
          <h2 className="text-xl font-bold text-[#DC2626] mb-3">
            Critical alerts (last 24 hours)
          </h2>
          <div className="space-y-3">
            {data.critical_alerts.map((a) => (
              <div key={a.id} className="bg-white rounded-xl px-4 py-3 border border-red-200">
                <p className="font-semibold text-[#0F172A] text-lg">
                  {a.resident_name} ({a.resident_number}
                  {a.room ? `, Room ${a.room}` : ""})
                </p>
                <p className="text-[#DC2626]">{a.reason}</p>
                <p className="text-sm text-slate-500">{formatTime(a.recorded_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <h2 className="text-xl font-semibold text-[#0F172A] px-6 pt-5">
          Nurse performance today
        </h2>
        <table className="w-full text-left mt-3">
          <thead className="bg-[#F0FDFA] text-slate-600">
            <tr>
              <th className="px-6 py-4">Nurse</th>
              <th className="px-6 py-4">Scheduled</th>
              <th className="px-6 py-4">Given</th>
              <th className="px-6 py-4">Missed</th>
              <th className="px-6 py-4">Pending</th>
              <th className="px-6 py-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.nurse_scores.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-slate-500">No nurses yet.</td>
              </tr>
            )}
            {data.nurse_scores.map((n) => (
              <tr key={n.nurse_id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 font-medium text-[#0F172A]">{n.name}</td>
                <td className="px-6 py-4">{n.scheduled}</td>
                <td className="px-6 py-4">{n.given}</td>
                <td className="px-6 py-4">{n.missed}</td>
                <td className="px-6 py-4">{n.pending}</td>
                <td className="px-6 py-4">
                  <ScoreBadge score={n.score} color={n.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}