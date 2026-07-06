import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../store/AuthStore";
import "./AuthModal.css";

const MotionDiv = motion.div;
const MotionButton = motion.button;

const TAGLINE = "grab a seat. press play. lock in.";

function getAuthErrorMessage(mode, error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (message) return message;
  if (mode === "register") return "Unable to create account right now.";
  return "Unable to log in right now.";
}

const stageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const riseVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 170, damping: 22 },
  },
};

export function AuthModal({ onAuthed }) {
  const { login, register, isAuthenticating } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (typedCount >= TAGLINE.length) return undefined;
    const timeoutId = setTimeout(
      () => setTypedCount((count) => count + 1),
      typedCount === 0 ? 700 : 42,
    );
    return () => clearTimeout(timeoutId);
  }, [typedCount]);

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
      <div className="auth-sky" aria-hidden="true">
        <div className="auth-stars" />
        <div className="auth-stars auth-stars-far" />
        <div className="auth-cloud auth-cloud-1" />
        <div className="auth-cloud auth-cloud-2" />
        <div className="auth-cloud auth-cloud-3" />
        <div className="auth-horizon-glow" />
      </div>

      <MotionDiv
        className="auth-stage-content"
        variants={stageVariants}
        initial="hidden"
        animate="visible"
      >
        <MotionDiv className="auth-brand" variants={riseVariants}>
          <h1>
            Lofi<span>Focus</span>Desk
          </h1>
          <p className="auth-tagline">
            {TAGLINE.slice(0, typedCount)}
            <span className="auth-caret" aria-hidden="true" />
          </p>
        </MotionDiv>

        <MotionDiv className="auth-modal" variants={riseVariants}>
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
            <MotionButton
              type="submit"
              className="auth-submit"
              disabled={isAuthenticating}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {isAuthenticating ? (
                <span className="auth-submit-spinner" aria-hidden="true" />
              ) : null}
              <span>{buttonState}</span>
            </MotionButton>
          </form>
          <button type="button" className="auth-switch" onClick={toggleMode}>
            {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
          </button>
        </MotionDiv>
      </MotionDiv>

      <div className="auth-grain" aria-hidden="true" />
      <div className="auth-vignette" aria-hidden="true" />
    </div>
  );
}
