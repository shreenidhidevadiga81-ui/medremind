import { useEffect, useState } from "react";
import { createNurse, listNurses } from "../api";

const emptyForm = { full_name: "", username: "", phone: "", password: "" };

function Field({ label, hint, ...props }) {
  return (
    <div>
      <label className="block text-base font-medium text-[#0F172A] mb-1">{label}</label>
      <input
        {...props}
        required
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
      />
      {hint && <p className="text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function Nurses() {
  const token = localStorage.getItem("token");
  const [nurses, setNurses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNurses() {
    setLoading(true);
    setError("");
    try {
      setNurses(await listNurses(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNurses();
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
      const nurse = await createNurse(token, {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setMessage(`${nurse.full_name} was added. She must change her password at first login.`);
      setForm(emptyForm);
      setShowForm(false);
      await loadNurses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Nurses</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError("");
          }}
          className="rounded-lg bg-[#0F766E] hover:bg-[#115e59] text-white font-semibold px-5 py-2 text-lg"
        >
          {showForm ? "Cancel" : "+ Add nurse"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border border-[#16A34A] text-[#16A34A] px-4 py-3 mb-4">
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow p-6 mb-6 space-y-5">
          <h2 className="text-xl font-semibold text-[#0F172A]">New nurse</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full name" name="full_name" value={form.full_name} onChange={updateField} />
            <Field label="Username" name="username" value={form.username} onChange={updateField}
              hint="At least 3 characters" />
            <Field label="Phone number" name="phone" value={form.phone} onChange={updateField}
              inputMode="numeric" maxLength={10} hint="10 digits. Used for forgot password." />
            <Field label="Temporary password" name="password" value={form.password} onChange={updateField}
              hint="At least 8 characters. Tell the nurse. She will change it at first login." />
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
            {saving ? "Saving..." : "Create nurse account"}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F0FDFA] text-slate-600">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-slate-500">Loading...</td>
              </tr>
            )}
            {!loading && nurses.length === 0 && !error && (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-slate-500">No nurses yet.</td>
              </tr>
            )}
            {nurses.map((nurse) => (
              <tr key={nurse.id} className="border-t border-slate-100 text-lg">
                <td className="px-6 py-4 font-medium text-[#0F172A]">{nurse.full_name}</td>
                <td className="px-6 py-4">{nurse.username}</td>
                <td className="px-6 py-4">{nurse.phone}</td>
                <td className="px-6 py-4">
                  {nurse.is_active ? (
                    <span className="rounded-full bg-green-100 text-[#16A34A] px-3 py-1 text-sm font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 text-slate-600 px-3 py-1 text-sm font-semibold">
                      Disabled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}