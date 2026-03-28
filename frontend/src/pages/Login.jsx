
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      });
      const data = res?.data;
      if (data?.success && data.data?.user) {
        login(data.data.user);
        setSuccess(true);
        setTimeout(() => navigate("/"), 800);
      } else {
        setError(data?.message || "Login failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md space-y-6">
        {/* card wrapper */}
        <div className="rounded-2xl bg-white shadow-lg border border-gray-100 p-8 space-y-6">
          {/* heading */}
          <div className="text-center">
            <div className="text-4xl mb-2">🌱</div>
            <h1 className="text-2xl font-extrabold text-gray-800">Welcome Back</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your marketplace account
            </p>
          </div>

          {/* success toast */}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 text-center animate-pulse">
              ✅ Login successful — redirecting…
            </div>
          )}

          {/* error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-600 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            {/* password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 text-sm font-bold text-white
                         hover:from-green-700 hover:to-emerald-600 transition-all duration-200 shadow-md
                         hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-700 transition-colors duration-200">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
