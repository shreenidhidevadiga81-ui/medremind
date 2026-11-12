import { useEffect, useState } from "react";
import { getTodaysDoses, markDose } from "../api";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  if (status === "given") {
    return (
      <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
        Given
      </span>
    );
  }
  if (status === "missed") {
    return (
      <span className="rounded-full bg-red-100 text-[#DC2626] px-3 py-1 text-sm font-semibold">
        Missed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm font-semibold">
      Pending
    </span>
  );
}

export default function Doses({ user }) {
  const token = localStorage.getItem("token");
  const isNurse = user?.role === "nurse";

  const [doses, setDoses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function loadDoses() {
    setError("");
    try {
      setDoses(await getTodaysDoses(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoses();
  }, []);

  async function handleMark(dose, status) {
    setBusyId(dose.id);
    setError("");
    try {
      await markDose(token, dose.id, status);
      await loadDoses();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = doses.filter((d) => d.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Today's doses</h1>
        <p className="text-slate-600 text-lg">
          {doses.length} total, {pending} pending
        </p>
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
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4">Medicine</th>
              <th className="px-6 py-4">Dosage</th>
              <th className="px-6 py-4">Status</th>
              {isNurse && <th className="px-6 py-4">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && doses.length === 0 && !error && (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-slate-500">
                  No doses scheduled for today.
                </td>
              </tr>
            )}
            {doses.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 font-semibold text-[#0F172A]">
                  {formatTime(d.scheduled_for)}
                </td>
                <td className="px-6 py-4">{d.resident_name}</td>
                <td className="px-6 py-4">{d.medicine_name}</td>
                <td className="px-6 py-4">{d.dosage}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={d.status} />
                </td>
                {isNurse && (
                  <td className="px-6 py-4">
                    {d.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === d.id}
                          onClick={() => handleMark(d, "given")}
                          className="rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2"
                        >
                          Given
                        </button>
                        <button
                          disabled={busyId === d.id}
                          onClick={() => handleMark(d, "missed")}
                          className="rounded-lg bg-[#DC2626] hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-4 py-2"
                        >
                          Missed
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}