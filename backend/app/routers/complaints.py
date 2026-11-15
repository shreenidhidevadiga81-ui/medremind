import { useEffect, useState } from "react";
import {
  listComplaints,
  listMyComplaints,
  sendComplaint,
  setComplaintStatus,
} from "../api";

function formatDate(iso) {
  return new Date(iso).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  if (status === "resolved") {
    return (
      <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
        Resolved
      </span>
    );
  }
  if (status === "seen") {
    return (
      <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm font-semibold">
        Seen
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-200 text-slate-700 px-3 py-1 text-sm font-semibold">
      Sent
    </span>
  );
}

export default function Complaints({ user }) {
  const token = localStorage.getItem("token");
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadItems() {
    setError("");
    try {
      setItems(isAdmin ? await listComplaints(token) : await listMyComplaints(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSend() {
    setBusy(true);
    setError("");
    try {
      await sendComplaint(token, message);
      setMessage("");
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(id, status) {
    setBusy(true);
    setError("");
    try {
      await setComplaintStatus(token, id, status);
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F172A] mb-6">Complaints</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <p className="text-lg text-[#0F172A] font-semibold mb-2">
            Send a message to the admin
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Write your issue here..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-slate-500">{message.length}/500</span>
            <button
              disabled={busy || message.trim().length === 0}
              onClick={handleSend}
              className="rounded-lg bg-[#0F766E] hover:bg-teal-800 disabled:opacity-40 text-white font-semibold px-6 py-3 text-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F0FDFA] text-slate-600">
            <tr>
              <th className="px-6 py-4">Date</th>
              {isAdmin && <th className="px-6 py-4">From</th>}
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Status</th>
              {isAdmin && <th className="px-6 py-4">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-slate-500">
                  No messages yet.
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(c.created_at)}</td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#0F172A]">{c.family_name}</div>
                    <div className="text-sm text-slate-500">{c.resident_name || "-"}</div>
                  </td>
                )}
                <td className="px-6 py-4">{c.message}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={c.status} />
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {c.status === "sent" && (
                        <button
                          disabled={busy}
                          onClick={() => handleStatus(c.id, "seen")}
                          className="rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-4 py-2"
                        >
                          Seen
                        </button>
                      )}
                      {c.status !== "resolved" && (
                        <button
                          disabled={busy}
                          onClick={() => handleStatus(c.id, "resolved")}
                          className="rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2"
                        >
                          Resolved
                        </button>
                      )}
                    </div>
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