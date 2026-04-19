import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser, setStoredUserId } from "../services/api";

function LoginPage() {
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
        await loginUser(trimmedUserId, password);
        setStoredUserId(trimmedUserId);
        navigate("/", { replace: true });
        return;
      }

      await signupUser(trimmedUserId, password);
      setStoredUserId(trimmedUserId);
      setSuccessMessage("Account created successfully.");
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to complete this request right now.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <section className="page page--auth">
      <div className="content-panel content-panel--narrow auth-panel">
        <div className="section-heading">
          <h1>Login or Signup</h1>
          <p>Use your account to personalize likes and recommendations.</p>
        </div>

        <div className="auth-form">
          <label className="search-panel__label" htmlFor="user-id">
            User ID
          </label>
          <input
            id="user-id"
            className="search-panel__input"
            type="text"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Enter your user ID"
            autoComplete="username"
          />

          <label className="search-panel__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="search-panel__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="auth-actions">
            <button
              className="search-panel__button"
              type="button"
              onClick={() => handleAuthAction("login")}
              disabled={loadingAction !== ""}
            >
              {loadingAction === "login" ? "Logging in..." : "Login"}
            </button>

            <button
              className="auth-actions__secondary"
              type="button"
              onClick={() => handleAuthAction("signup")}
              disabled={loadingAction !== ""}
            >
              {loadingAction === "signup" ? "Creating..." : "Signup"}
            </button>
          </div>

          {error ? <p className="status-message status-message--error">{error}</p> : null}
          {successMessage ? <p className="status-message">{successMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
