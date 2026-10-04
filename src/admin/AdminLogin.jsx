import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Login successful
      window.location.href = "/admin/dashboard";
    } catch (loginError) {
      console.error("Firebase login error:", loginError);

      if (
        loginError.code === "auth/invalid-credential" ||
        loginError.code === "auth/wrong-password" ||
        loginError.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else if (loginError.code === "auth/too-many-requests") {
        setError("Too many login attempts. Please try again later.");
      } else if (loginError.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(loginError.message || "Login failed. Please try again.");
      }

      setLoading(false);
    }
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