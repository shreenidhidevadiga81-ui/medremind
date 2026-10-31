import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Nurses from "./pages/Nurses";
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
  }

  if (!token) return <Login onLoggedIn={handleLoggedIn} />;

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
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}