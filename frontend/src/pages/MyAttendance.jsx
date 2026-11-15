import { useEffect, useState } from "react";
import { getMyAttendanceToday, checkIn, checkOut, markLeave } from "../api";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MyAttendance() {
  const token = localStorage.getItem("token");

  const [row, setRow] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadToday() {
    setError("");
    try {
      setRow(await getMyAttendanceToday(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadToday();
  }, []);

  async function handleAction(action) {
    setBusy(true);
    setError("");
    try {
      await action(token);
      await loadToday();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  let statusText = "You have not checked in today.";
  if (row && row.status === "leave") {
    statusText = "You are marked on leave today.";
  } else if (row && row.check_out) {
    statusText = `Checked in at ${formatTime(row.check_in)}, checked out at ${formatTime(row.check_out)}.`;
  } else if (row && row.check_in) {
    statusText = `Checked in at ${formatTime(row.check_in)}.`;
  }

  const canCheckIn = !row;
  const canCheckOut = row && row.check_in && !row.check_out;
  const canLeave = !row;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-6">My attendance</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-xl text-[#0F172A] mb-6">
          {loading ? "Loading..." : statusText}
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy || !canCheckIn}
            onClick={() => handleAction(checkIn)}
            className="rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:opacity-40 text-white font-semibold px-6 py-3 text-lg"
          >
            Check in
          </button>
          <button
            disabled={busy || !canCheckOut}
            onClick={() => handleAction(checkOut)}
            className="rounded-lg bg-[#0F172A] hover:bg-slate-700 disabled:opacity-40 text-white font-semibold px-6 py-3 text-lg"
          >
            Check out
          </button>
          <button
            disabled={busy || !canLeave}
            onClick={() => handleAction(markLeave)}
            className="rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold px-6 py-3 text-lg"
          >
            On leave today
          </button>
        </div>
      </div>
    </div>
  );
}