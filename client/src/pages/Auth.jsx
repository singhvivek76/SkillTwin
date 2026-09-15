import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function Auth({ onAuthSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isLogin) {
      // 1. SIGN IN FLOW -> redirects to Dashboard
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        // Save session and redirect straight to Dashboard
        localStorage.setItem("skilltwin_token", data.token);
        localStorage.setItem("skilltwin_user", JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // 2. CREATE ACCOUNT FLOW -> creates account, does NOT go to dashboard, switches to Sign In
      try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            fullName: name,
            email,
            password,
            college,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        // Clear password and switch to Sign In view with a green success banner
        setPassword("");
        setIsLogin(true);
        setSuccessMsg("Account created successfully! Please sign in with your credentials.");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f14] px-4">
      <div className="w-full max-w-md panel p-8">
        <button
          onClick={onBack}
          className="mb-6 font-mono text-xs text-muted hover:text-white transition-colors"
        >
          ← Back to home
        </button>

        <h2 className="text-2xl font-bold tracking-tight">
          {isLogin ? "Sign in to SkillTwin" : "Create candidate account"}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {isLogin ? "Enter your email and password to access the dashboard" : "Set up your developer profile"}
        </p>

        {/* Success Banner after creating account */}
        {successMsg && (
          <div className="mt-4 rounded-lg border border-strong/40 bg-strong/10 p-3 font-mono text-xs text-strong">
            ✓ {successMsg}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4 rounded-lg border border-weak/40 bg-weak/10 p-3 font-mono text-xs text-weak">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block font-mono text-xs text-muted">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vivek Kumar Singh"
                  className="mt-1 w-full rounded-lg border border-panelBorder bg-[#0f131a] px-3 py-2 text-xs text-white outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted">College / Branch</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="MIT Meerut — CSE"
                  className="mt-1 w-full rounded-lg border border-panelBorder bg-[#0f131a] px-3 py-2 text-xs text-white outline-none focus:border-brand"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-mono text-xs text-muted">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="mt-1 w-full rounded-lg border border-panelBorder bg-[#0f131a] px-3 py-2 text-xs text-white outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-panelBorder bg-[#0f131a] px-3 py-2 text-xs text-white outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 font-mono text-xs font-bold text-[#0c0f14] hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing…" : isLogin ? "Sign In →" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMsg(null);
            }}
            className="font-mono text-xs text-muted underline hover:text-brand transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
