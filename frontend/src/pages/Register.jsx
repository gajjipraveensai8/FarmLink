import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const ROLES = [
  { label: "Buyer", value: "buyer", emoji: "🛒", desc: "Shop fresh produce" },
  { label: "Farmer", value: "farmer", emoji: "👨‍🌾", desc: "Sell your harvest" },
  { label: "Delivery", value: "delivery_partner", emoji: "🚚", desc: "Deliver orders" },
];

function getPasswordStrength(password) {
  if (!password) return { label: "", width: "0%", color: "bg-slate-200" };
  if (password.length < 6) return { label: "Too short", width: "20%", color: "bg-red-500" };
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 10) score++;
  if (score <= 2) return { label: "Weak", width: "35%", color: "bg-amber-500" };
  if (score === 3) return { label: "Medium", width: "65%", color: "bg-blue-500" };
  return { label: "Strong", width: "100%", color: "bg-brand-500" };
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "buyer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", form);
      if (res?.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(res?.data?.message || "Registration failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-white/50 font-medium">Join the FarmFresh marketplace</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-2xl bg-brand-500/20 border border-brand-400/30 px-4 py-3 flex items-center gap-3 text-brand-300 font-semibold text-sm">
              <span>✅</span> Account created! Redirecting to login…
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-3 flex items-center gap-3 text-red-300 font-medium text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white/70 mb-2">Full Name</label>
              <input
                id="name" name="name" type="text" required
                value={form.name} onChange={handleChange}
                placeholder="Your Name"
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/70 mb-2">Email Address</label>
              <input
                id="email" name="email" type="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@email.com"
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-white/70 mb-2">Phone Number</label>
              <input
                id="phone" name="phone" type="tel" required
                value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210"
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/70 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? "text" : "password"}
                  required minLength={6}
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-lg transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white/50">{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-3">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-3.5 text-sm font-bold transition-all duration-200
                      ${form.role === r.value
                        ? "border-brand-500 bg-brand-500/20 text-brand-300"
                        : "border-white/10 text-white/50 hover:border-white/25 hover:bg-white/5"
                      }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-[11px] leading-none">{r.label}</span>
                    <span className="text-[9px] font-normal text-white/30">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-2xl bg-brand-600 hover:bg-brand-500 px-4 py-3.5 text-sm font-black text-white
                         transition-all duration-200 shadow-lg shadow-brand-900/40
                         hover:shadow-xl hover:shadow-brand-900/50 hover:-translate-y-0.5
                         active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait disabled:hover:translate-y-0"
            >
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-brand-400 hover:text-brand-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
