import { useEffect, useState } from "react";
import { listVitals, recordVitals } from "../api";

const emptyForm = { systolic: "", diastolic: "", sugar: "", oxygen: "" };

function Field({ label, hint, ...props }) {
  return (
    <div>
      <label className="block text-base font-medium text-[#0F172A] mb-1">{label}</label>
      <input
        {...props}
        type="number"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
      />
      {hint && <p className="text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function toNumber(value) {
  return value === "" ? null : Number(value);
}

function formatDate(iso) {
  // the server sends UTC time without a "Z", so we add it before converting
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VitalsPanel({ resident, user, onClose }) {
  const token = localStorage.getItem("token");
  const isNurse = user?.role === "nurse";

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [criticalNote, setCriticalNote] = useState("");

  async function loadVitals() {
    setError("");
    try {
      setVitals(await listVitals(token, resident.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVitals();
  }, []);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setMessage("");
    setCriticalNote("");
    setSaving(true);
    try {
      const saved = await recordVitals(token, resident.id, {
        systolic: toNumber(form.systolic),
        diastolic: toNumber(form.diastolic),
        sugar: toNumber(form.sugar),
        oxygen: toNumber(form.oxygen),
      });
      if (saved.is_critical) {
        setCriticalNote(saved.critical_reason);
      } else {
        setMessage("Readings saved. All normal.");
      }
      setForm(emptyForm);
      await loadVitals();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Vitals for {resident.full_name}</h2>
            <p className="text-slate-500">
              {resident.resident_number}
              {resident.room ? `, Room ${resident.room}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2"
          >
            Close
          </button>
        </div>

        {message && (
          <div className="rounded-lg bg-green-50 border border-[#16A34A] text-[#16A34A] px-4 py-3">
            {message}
          </div>
        )}

        {criticalNote && (
          <div className="rounded-lg bg-red-50 border-2 border-[#DC2626] text-[#DC2626] px-4 py-3 font-semibold">
            CRITICAL: {criticalNote}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3">
            {error}
          </div>
        )}

        {isNurse && (
          <form onSubmit={handleSave} className="space-y-4 border border-slate-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#0F172A]">Record new readings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="BP top" name="systolic" value={form.systolic}
                onChange={updateField} hint="Example: 120" />
              <Field label="BP bottom" name="diastolic" value={form.diastolic}
                onChange={updateField} hint="Example: 80" />
              <Field label="Sugar (mg/dL)" name="sugar" value={form.sugar}
                onChange={updateField} hint="Example: 110" />
              <Field label="Oxygen (%)" name="oxygen" value={form.oxygen}
                onChange={updateField} hint="Example: 97" />
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0F766E] hover:bg-[#115e59] disabled:opacity-60 text-white font-semibold px-6 py-3 text-lg"
            >
              {saving ? "Saving..." : "Save readings"}
            </button>
          </form>
        )}

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F0FDFA] text-slate-600">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">BP</th>
                <th className="px-4 py-3">Sugar</th>
                <th className="px-4 py-3">Oxygen</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-slate-500">Loading...</td>
                </tr>
              )}
              {!loading && vitals.length === 0 && !error && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-slate-500">No readings yet.</td>
                </tr>
              )}
              {vitals.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatDate(v.recorded_at)}</td>
                  <td className="px-4 py-3">
                    {v.systolic != null ? `${v.systolic}/${v.diastolic}` : "-"}
                  </td>
                  <td className="px-4 py-3">{v.sugar ?? "-"}</td>
                  <td className="px-4 py-3">{v.oxygen != null ? `${v.oxygen}%` : "-"}</td>
                  <td className="px-4 py-3">
                    {v.is_critical ? (
                      <div>
                        <span className="rounded-full bg-red-100 text-[#DC2626] px-3 py-1 text-sm font-semibold">
                          Critical
                        </span>
                        <div className="text-sm text-[#DC2626] mt-1">{v.critical_reason}</div>
                      </div>
                    ) : (
                      <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}