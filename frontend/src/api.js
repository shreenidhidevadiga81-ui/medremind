const API_URL = "http://127.0.0.1:8000";

async function readError(res, fallback) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const field = first.loc ? first.loc[first.loc.length - 1] : "input";
      return `Please check "${field}": ${first.msg}`;
    }
  } catch {
    // ignore
  }
  return fallback;
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    window.location.reload();
    throw new Error("Your session expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(await readError(res, "Something went wrong"));
  return res.json();
}

export const login = (identifier, password) =>
  request("/auth/login", { method: "POST", body: { identifier, password } });

export const getMe = (token) => request("/auth/me", { token });

export const listNurses = (token) => request("/nurses", { token });

export const createNurse = (token, data) =>
  request("/nurses", { method: "POST", token, body: data });

export const updateNurse = (token, id, data) =>
  request(`/nurses/${id}`, { method: "PATCH", token, body: data });

export const resetNursePassword = (token, id, newPassword) =>
  request(`/nurses/${id}/reset-password`, {
    method: "POST",
    token,
    body: { new_password: newPassword },
  });

export const forgotPassword = (identifier) =>
  request("/auth/forgot-password", { method: "POST", body: { identifier } });

export const resetWithOtp = (identifier, otp, newPassword) =>
  request("/auth/reset-password", {
    method: "POST",
    body: { identifier, otp, new_password: newPassword },
  });

export const listResidents = (token, search = "") =>
  request(`/residents${search ? `?search=${encodeURIComponent(search)}` : ""}`, { token });

export const createResident = (token, data) =>
  request("/residents", { method: "POST", token, body: data });

export const getResident = (token, id) => request(`/residents/${id}`, { token });

export const listMedicines = (token, residentId) =>
  request(`/residents/${residentId}/medicines`, { token });

export const addMedicine = (token, residentId, data) =>
  request(`/residents/${residentId}/medicines`, { method: "POST", token, body: data });

export const stopMedicine = (token, medicineId) =>
  request(`/medicines/${medicineId}/stop`, { method: "POST", token });

export const getTodaysDoses = (token) => request("/doses/today", { token });

export const markDose = (token, doseId, status, note = null) =>
  request(`/doses/${doseId}/mark`, { method: "POST", token, body: { status, note } });

export const listVitals = (token, residentId) =>
  request(`/residents/${residentId}/vitals`, { token });

export const recordVitals = (token, residentId, data) =>
  request(`/residents/${residentId}/vitals`, { method: "POST", token, body: data });

export const getDashboard = (token) => request("/dashboard", { token });