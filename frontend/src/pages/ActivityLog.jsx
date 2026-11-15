import { useEffect, useState } from "react";
import { listActivity } from "../api";

function formatDate(iso) {
  return new Date(iso).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLog() {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadActivity() {
    setError("");
    try {
      setRows(await listActivity(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Activity log</h1>
        <button
          onClick={loadActivity}
          className="rounded-lg bg-[#0F766E] hover:bg-teal-800 text-white font-semibold px-5 py-2 text-lg"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F0FDFA] text-slate-600">
            <tr>
              <th className="px-6 py-4">When</th>
              <th className="px-6 py-4">Who</th>
              <th className="px-6 py-4">What happened</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="3" className="px-6 py-6 text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan="3" className="px-6 py-6 text-slate-500">
                  No activity yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#0F172A]">{r.user_name || "System"}</div>
                  <div className="text-sm text-slate-500">{r.user_role || "-"}</div>
                </td>
                <td className="px-6 py-4">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}