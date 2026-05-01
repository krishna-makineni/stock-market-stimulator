import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { MdShowChart, MdEmail, MdLock } from "react-icons/md";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        toast.success("Welcome back! 📈", { theme: "dark" });
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neon-green flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.4)]">
              <MdShowChart className="text-dark-900 text-2xl" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Stock<span className="neon-text">Sim</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-mono">
            Virtual Trading Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 neon-border">
          <h2 className="font-display font-semibold text-white mb-5">
            Sign in to trade
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder=""
                  className="w-full bg-dark-700 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-neon-green transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-mono uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-dark-700 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-neon-green transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon-green text-dark-900 font-bold font-display py-2.5 rounded-lg hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-4 font-mono">
            New trader?{" "}
            <Link
              to="/register"
              className="text-neon-green hover:underline font-semibold"
            >
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4 font-mono">
          Start with ₹100,000 virtual cash
        </p>
      </div>
    </div>
  );
};

export default Login;
