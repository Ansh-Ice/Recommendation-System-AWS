import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { getStoredUserId } from "./services/api";

function App() {
  const [user, setUser] = useState(() => getStoredUserId());

  return (
    <div className="app-shell">
      <Navbar user={user} setUser={setUser} />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={user ? <HomePage user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/about"
            element={user ? <AboutPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
