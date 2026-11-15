import { useEffect, useState } from "react";
import { listAttendance } from "../api";

function formatTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function StateBadge({ state }) {
  if (state === "checked_in") {
    return (
      <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
        Checked in
      </span>
    );
  }
  if (state === "checked_out") {
    return (
      <span className="rounded-full bg-slate-200 text-slate-700 px-3 py-1 text-sm font-semibold">
        Checked out
      </span>
    );
  }
  if (state === "on_leave") {
    return (
      <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm font-semibold">
        On leave
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 text-[#DC2626] px-3 py-1 text-sm font-semibold">
      Not checked in
    </span>
  );
}

export default function Attendance() {
  const token = localStorage.getItem("token");

  const [day, setDay] = useState(todayString());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAttendance(selectedDay) {
    setError("");
    setLoading(true);
    try {
      setRows(await listAttendance(token, selectedDay));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance(day);
  }, [day]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Nurse attendance</h1>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-lg"
        />
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
              <th className="px-6 py-4">Nurse</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Check-in</th>
              <th className="px-6 py-4">Check-out</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-slate-500">
                  No nurses found.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.nurse_id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 font-semibold text-[#0F172A]">{r.nurse_name}</td>
                <td className="px-6 py-4">
                  <StateBadge state={r.state} />
                </td>
                <td className="px-6 py-4">{formatTime(r.check_in)}</td>
                <td className="px-6 py-4">{formatTime(r.check_out)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}