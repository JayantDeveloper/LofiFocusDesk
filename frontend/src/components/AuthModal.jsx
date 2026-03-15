import { useState } from "react";
import { useAuth } from "../store/AuthStore";
import "./AuthModal.css";

function getAuthErrorMessage(mode, error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (message) return message;
  if (mode === "register") return "Unable to create account right now.";
  return "Unable to log in right now.";
}

export function AuthModal({ onAuthed }) {
  const { login, register, isAuthenticating } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        await login(username, password);
      } else {
        await register(username, password);
      }
      onAuthed?.();
    } catch (err) {
      setError(getAuthErrorMessage(mode, err));
    }
  };

  const buttonState = isAuthenticating
    ? mode === "login"
      ? "Signing in..."
      : "Creating account..."
    : mode === "login"
      ? "Log in"
      : "Register";

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
              disabled={isAuthenticating}
              autoComplete="username"
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
              disabled={isAuthenticating}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              minLength={mode === "register" ? 8 : undefined}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-submit" disabled={isAuthenticating}>
          {isAuthenticating ? <span className="auth-submit-spinner" aria-hidden="true" /> : null}
          <span>{buttonState}</span>
        </button>
        </form>
        <button type="button" className="auth-switch" onClick={toggleMode}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
