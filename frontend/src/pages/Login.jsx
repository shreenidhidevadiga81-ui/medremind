import { useState } from "react";
import Logo from "../components/Logo";
import { login } from "../api";

export default function Login({ onLoggedIn, onForgot }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(identifier.trim(), password);
      onLoggedIn(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo size={72} />
          <h1 className="mt-4 text-3xl font-bold text-[#0F172A]">MedRemind</h1>
          <p className="text-slate-600 mt-1">Care that never misses a dose</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-[#0F172A] mb-1">
              Username or phone number
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-[#0F172A] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#0F766E]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0F766E] hover:bg-[#115e59] disabled:opacity-60 text-white text-lg font-semibold py-3"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p
            onClick={onForgot}
            className="text-center text-[#0F766E] font-medium cursor-pointer"
          >
            Forgot password?
          </p>
        </form>
      </div>
    </div>
  );
}