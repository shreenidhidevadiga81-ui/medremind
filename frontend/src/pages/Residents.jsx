import { useEffect, useState } from "react";
import { createResident, listResidents } from "../api";
import MedicinesPanel from "../components/MedicinesPanel";
import VitalsPanel from "../components/VitalsPanel";

const emptyForm = {
  full_name: "",
  id_number: "",
  age: "",
  gender: "",
  room: "",
  medical_conditions: "",
  allergies: "",
  contact_number: "",
  family_full_name: "",
  family_username: "",
  family_phone: "",
  family_password: "",
};

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

// empty text boxes should be sent as null, not ""
function clean(value) {
  const text = value.trim();
  return text === "" ? null : text;
}

export default function Residents({ user }) {
  const token = localStorage.getItem("token");
  const isNurse = user?.role === "nurse";

  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedVitals, setSelectedVitals] = useState(null);

  async function loadResidents(text = search) {
    setLoading(true);
    setError("");
    try {
      setResidents(await listResidents(token, text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResidents("");
  }, []);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSearch(e) {
    e.preventDefault();
    loadResidents(search);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    setMessage("");
    setSaving(true);
    try {
      const resident = await createResident(token, {
        full_name: form.full_name.trim(),
        id_number: clean(form.id_number),
        age: form.age === "" ? null : Number(form.age),
        gender: clean(form.gender),
        room: clean(form.room),
        medical_conditions: clean(form.medical_conditions),
        allergies: clean(form.allergies),
        contact_number: clean(form.contact_number),
        family_full_name: clean(form.family_full_name),
        family_username: clean(form.family_username),
        family_phone: clean(form.family_phone),
        family_password: clean(form.family_password),
      });
      setMessage(`${resident.full_name} was registered as ${resident.resident_number}.`);
      setForm(emptyForm);
      setShowForm(false);
      await loadResidents(search);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A]">Residents</h1>
        {isNurse && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
            }}
            className="rounded-lg bg-[#0F766E] hover:bg-[#115e59] text-white font-semibold px-5 py-2 text-lg"
          >
            {showForm ? "Cancel" : "+ Add resident"}
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border border-[#16A34A] text-[#16A34A] px-4 py-3 mb-4">
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow p-6 mb-6 space-y-5">
          <h2 className="text-xl font-semibold text-[#0F172A]">New resident</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full name" name="full_name" value={form.full_name}
              onChange={updateField} required />
            <Field label="ID number (optional)" name="id_number" value={form.id_number}
              onChange={updateField} hint="Leave empty if the resident has no ID." />
            <Field label="Age" name="age" type="number" min="0" max="130"
              value={form.age} onChange={updateField} />
            <Field label="Gender" name="gender" value={form.gender}
              onChange={updateField} hint="For example: Male, Female" />
            <Field label="Room" name="room" value={form.room} onChange={updateField} />
            <Field label="Contact number" name="contact_number" value={form.contact_number}
              onChange={updateField} inputMode="numeric" maxLength={10}
              hint="10 digits (optional)" />
            <Field label="Medical conditions" name="medical_conditions"
              value={form.medical_conditions} onChange={updateField}
              hint="For example: Diabetes, High BP" />
            <Field label="Allergies" name="allergies" value={form.allergies}
              onChange={updateField} />
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-lg font-semibold text-[#0F172A]">Family login (optional)</h3>