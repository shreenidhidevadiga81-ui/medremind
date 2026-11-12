import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Nurses from "./pages/Nurses";
import Residents from "./pages/Residents";
import Doses from "./pages/Doses";
import { getMe } from "./api";

function ComingSoon() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 text-slate-500 text-lg">
      This page is coming soon.
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(setUser)
      .catch(() => logout());
  }, [token]);

  function handleLoggedIn(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setShowForgot(false);
  }

  if (!token) {
    return showForgot ? (
      <ForgotPassword onBack={() => setShowForgot(false)} />
    ) : (
      <Login onLoggedIn={handleLoggedIn} onForgot={() => setShowForgot(true)} />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center text-slate-600 text-xl">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nurses" element={<Nurses />} />
          <Route path="/residents" element={<Residents user={user} />} />
          <Route path="/doses" element={<Doses user={user} />} />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}