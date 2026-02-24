import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./AuthModal.css";

export function AuthModal() {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login(username, password, remember);
      } else {
        await register(username, password, remember);
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  if (user) return null;

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal">
        <div className="auth-header">
          <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p>Sign in to sync tasks and calendar.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              required
              minLength={3}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              minLength={mode === "register" ? 8 : undefined}
            />
          </label>
          {mode === "login" && (
            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit">{mode === "login" ? "Log in" : "Register"}</button>
        </form>
        <button type="button" className="auth-switch" onClick={toggleMode}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
