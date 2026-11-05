import { useState } from "react";
import Logo from "../components/Logo";
import { forgotPassword, resetWithOtp } from "../api";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]";
const buttonClass =
  "w-full rounded-lg bg-[#0F766E] hover:bg-[#115e59] disabled:opacity-60 text-white text-lg font-semibold py-3";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await forgotPassword(identifier.trim());
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await resetWithOtp(identifier.trim(), otp.trim(), newPassword);
      setInfo(data.message);
      setStep(3);
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
          <Logo size={64} />
          <h1 className="mt-4 text-2xl font-bold text-[#0F172A]">Reset your password</h1>
        </div>

        {info && (
          <div className="rounded-lg bg-green-50 border border-[#16A34A] text-[#16A34A] px-4 py-3 mb-4">
            {info}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-[#DC2626] text-[#DC2626] px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={sendCode} className="space-y-5">
            <p className="text-slate-600">
              Enter your username or phone number. We will send a 6-digit code to your registered
              phone number.
            </p>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username or phone number"
              required
              className={inputClass}
            />
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="space-y-5">
            <div>
              <label className="block text-base font-medium text-[#0F172A] mb-1">6-digit code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-[#0F172A] mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={inputClass}
              />
              <p className="text-sm text-slate-500 mt-1">At least 8 characters.</p>
            </div>
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Saving..." : "Change password"}
            </button>
            <p
              onClick={() => {
                setStep(1);
                setError("");
                setInfo("");
              }}
              className="text-center text-[#0F766E] font-medium cursor-pointer"
            >
              Send a new code
            </p>
          </form>
        )}

        {step === 3 && (
          <button onClick={onBack} className={buttonClass}>
            Back to sign in
          </button>
        )}

        {step !== 3 && (
          <p onClick={onBack} className="text-center text-slate-500 mt-5 cursor-pointer">
            Back to sign in
          </p>
        )}
      </div>
    </div>
  );
}