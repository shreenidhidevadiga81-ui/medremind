import { useEffect, useState } from "react";
import { addMedicine, listMedicines, stopMedicine } from "../api";

const emptyForm = { name: "", dosage: "", times: "", instructions: "", end_date: "" };

function Field({ label, hint, required = false, ...props }) {
  return (
    <div>
      <label className="block text-base font-medium text-[#0F172A] mb-1">{label}</label>
      <input
        {...props}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
      />
      {hint && <p className="text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function MedicinesPanel({ resident, user, onClose }) {
  const token = localStorage.getItem("token");
  const isNurse = user?.role === "nurse";

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMedicines() {
    setError("");
    try {
      setMedicines(await listMedicines(token, resident.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    setMessage("");
    setSaving(true);
    try {
      // "8:00, 20:00" is not valid, so we also fix single-digit hours like 8:00 -> 08:00
      const times = form.times
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
        .map((t) => (t.indexOf(":") === 1 ? `0${t}` : t));

      const medicine = await addMedicine(token, resident.id, {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        times,
        instructions: form.instructions.trim() || null,
        end_date: form.end_date || null,
      });
      setMessage(`${medicine.name} was added.`);
      setForm(emptyForm);
      await loadMedicines();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStop(medicine) {
    if (!window.confirm(`Stop ${medicine.name} for ${resident.full_name}?`)) return;
    setError("");
    try {
      await stopMedicine(token, medicine.id);
      await loadMedicines();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Medicines for {resident.full_name}
            </h2>
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

        {resident.allergies && (
          <div className="rounded-lg bg-amber-50 border border-amber-400 text-amber-800 px-4 py-3">
            <span className="font-semibold">Allergies:</span> {resident.allergies}
          </div>
        )}

        {message && (
          <div className="rounded-lg bg-green-50 border border-[#16A34A] text-[#16A34A] px-4 py-3">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3">
            {error}
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F0FDFA] text-slate-600">
              <tr>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Dosage</th>
                <th className="px-4 py-3">Times</th>
                <th className="px-4 py-3">Status</th>
                {isNurse && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-slate-500">Loading...</td>
                </tr>
              )}
              {!loading && medicines.length === 0 && !error && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-slate-500">
                    No medicines yet.
                  </td>
                </tr>
              )}
              {medicines.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0F172A]">
                    {m.name}
                    {m.instructions && (
                      <div className="text-sm text-slate-500 font-normal">{m.instructions}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{m.dosage}</td>
                  <td className="px-4 py-3">{m.times.join(", ")}</td>
                  <td className="px-4 py-3">
                    {m.is_active ? (
                      <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 text-slate-600 px-3 py-1 text-sm font-semibold">
                        Stopped
                      </span>
                    )}
                  </td>
                  {isNurse && (
                    <td className="px-4 py-3">
                      {m.is_active && (
                        <button
                          onClick={() => handleStop(m)}
                          className="rounded-lg bg-[#DC2626] hover:bg-red-700 text-white font-semibold px-3 py-1"
                        >
                          Stop
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isNurse && (
          <form onSubmit={handleAdd} className="space-y-4 border-t border-slate-200 pt-5">
            <h3 className="text-lg font-semibold text-[#0F172A]">Add a medicine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Medicine name" name="name" value={form.name}
                onChange={updateField} required />
              <Field label="Dosage" name="dosage" value={form.dosage}
                onChange={updateField} required hint="For example: 500 mg, or 1 tablet" />
              <Field label="Times" name="times" value={form.times}
                onChange={updateField} required
                hint="24-hour format, separated by commas. Example: 08:00, 20:00" />
              <Field label="Instructions (optional)" name="instructions"
                value={form.instructions} onChange={updateField}
                hint="For example: after food" />
              <Field label="End date (optional)" name="end_date" type="date"
                value={form.end_date} onChange={updateField}
                hint="Leave empty if there is no end date" />
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
              {saving ? "Saving..." : "Add medicine"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}