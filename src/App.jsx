import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { getStoredUserId } from "./services/api";

function App() {
  const userId = getStoredUserId();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={userId ? <HomePage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/about"
            element={userId ? <AboutPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={!userId ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={userId ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
