import { useEffect, useState } from "react";
import Login from "./pages/Login";
import { getMe } from "./api";

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

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {user ? `Welcome, ${user.full_name}` : "Loading..."}
        </h1>
        {user && <p className="text-slate-600 mt-1 capitalize">Role: {user.role}</p>}
        <p className="text-slate-500 mt-4">Your dashboard will appear here.</p>
        <button
          onClick={logout}
          className="mt-6 rounded-lg bg-[#0F766E] text-white font-semibold px-6 py-2"
        >
          Log out
        </button>
      </div>
    </div>
  );
}