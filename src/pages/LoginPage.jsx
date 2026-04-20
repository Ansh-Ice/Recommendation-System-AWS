import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../services/api";
import { motion } from "framer-motion";
import { Film } from "lucide-react";

function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAuthAction = async (action) => {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId || !password) {
      setError("Please enter both user ID and password.");
      return;
    }

    setLoadingAction(action);
    setError("");
    setSuccessMessage("");

    try {
      if (action === "login") {
        const data = await loginUser(trimmedUserId, password);
        const authenticatedUserId = data.user_id || trimmedUserId;
        localStorage.setItem("user_id", authenticatedUserId);
        setUser(authenticatedUserId);
        navigate("/", { replace: true });
        return;
      }

      const data = await signupUser(trimmedUserId, password);
      const authenticatedUserId = data.user_id || trimmedUserId;
      localStorage.setItem("user_id", authenticatedUserId);
      setUser(authenticatedUserId);
      setSuccessMessage("Account created successfully.");
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to complete this request right now.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-blob bg-blob--1" style={{ top: '20%', left: '10%' }} />
      <div className="bg-blob bg-blob--2" style={{ bottom: '10%', right: '10%' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '450px', margin: '0 auto', padding: '3rem', zIndex: 10, position: 'relative' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Film className="text-gradient-warm mx-auto" size={48} style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Sign in to continue your cinematic journey.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }} htmlFor="user-id">
              User ID
            </label>
            <input
              id="user-id"
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', 
                color: 'var(--color-text-primary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)',
                fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter your user ID"
              autoComplete="username"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', 
                color: 'var(--color-text-primary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)',
                fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn--primary"
              style={{ flex: 1, padding: '1rem' }}
              type="button"
              onClick={() => handleAuthAction("login")}
              disabled={loadingAction !== ""}
            >
              {loadingAction === "login" ? "Authenticating..." : "Login"}
            </button>

            <button
              className="btn"
              style={{ flex: 1, padding: '1rem' }}
              type="button"
              onClick={() => handleAuthAction("signup")}
              disabled={loadingAction !== ""}
            >
              {loadingAction === "signup" ? "Creating..." : "Sign Up"}
            </button>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>
              {error}
            </motion.p>
          )}
          {successMessage && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--color-primary)', textAlign: 'center', fontSize: '0.9rem' }}>
              {successMessage}
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
