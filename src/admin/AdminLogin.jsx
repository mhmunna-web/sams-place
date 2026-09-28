import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./admin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("sp_admin_users")
      .select("id, full_name, role, is_active")
      .eq("id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError) {
      setError(adminError.message);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!adminUser) {
      await supabase.auth.signOut();

      setError(
        "You do not have permission to access the Sam's Place Admin Panel."
      );

      setLoading(false);
      return;
    }

    // Login successful
    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          SAM'S PLACE
        </div>

        <div className="admin-login-label">
          ADMIN PANEL
        </div>

        <h1>Welcome Back</h1>

        <p className="admin-login-subtitle">
          Sign in to manage your restaurant website.
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="admin-email">
            Email
          </label>

          <input
            id="admin-email"
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label htmlFor="admin-password">
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <div className="admin-login-footer">
          Sam's Place Admin
        </div>

      </div>
    </div>
  );
}