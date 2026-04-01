import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import GameConsole from "./pages/client/GameConsole";
import Profile from "./pages/client/Profile";
import Ranking from "./pages/client/Ranking";
import Achievements from "./pages/client/Achievements"; // <-- THÊM MỚI
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAchievementManager from "./pages/admin/AdminAchievementManager"; // <-- THÊM MỚI
import SocialPanel from "./pages/client/SocialPanel";
import "./App.css";

const LogoutButton = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <button
      onClick={handleLogout}
      style={{
        background: "transparent",
        color: "#EF4444",
        border: "1px solid #EF4444",
        padding: "5px 15px",
        borderRadius: "20px",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      ĐĂNG XUẤT
    </button>
  );
};

const MainContent = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <main
      className="main-content"
      style={{
        display: "flex",
        flexDirection: "row",
        padding: "30px 20px",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "stretch",
        gap: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: isHomePage ? "none" : "1",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
      {isHomePage && <SocialPanel />}
    </main>
  );
};

const ClientLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-logo">RETRO BOARD</div>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">TRANG CHỦ</Link>
          <Link to="/profile" className="nav-link">HỒ SƠ</Link>
          <Link to="/ranking" className="nav-link">XẾP HẠNG</Link>
          <Link to="/achievements" className="nav-link">THÀNH TỰU</Link> {/* <-- THÊM LINK */}
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "NỀN SÁNG" : "NỀN TỐI"}
          </button>
          <LogoutButton />
        </div>
      </nav>
      <MainContent>{children}</MainContent>
      <footer className="footer">2026 BOARD GAME PROJECT - WEB PROGRAMMING COURSE</footer>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="layout-container" style={{ borderTop: "5px solid #EF4444" }}>
      <nav className="navbar" style={{ background: "#0F172A" }}>
        <div className="navbar-logo" style={{ color: "#EF4444" }}>ADMIN PORTAL</div>
        <div className="navbar-menu">
          <Link to="/admin" className="nav-link">DASHBOARD</Link>
          <Link to="/admin/achievements" className="nav-link">QUẢN LÝ THÀNH TỰU</Link> {/* <-- THÊM LINK */}
          <LogoutButton />
        </div>
      </nav>
      <main className="main-content" style={{ alignItems: "flex-start", padding: "20px" }}>
        {children}
      </main>
      <footer className="footer" style={{ background: "#0F172A", color: "#EF4444" }}>
        SYSTEM ADMINISTRATION - AUTHORIZED PERSONNEL ONLY
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ClientLayout><GameConsole /></ClientLayout>} />
        <Route path="/profile" element={<ClientLayout><Profile /></ClientLayout>} />
        <Route path="/ranking" element={<ClientLayout><Ranking /></ClientLayout>} />
        <Route path="/achievements" element={<ClientLayout><Achievements /></ClientLayout>} /> {/* <-- ROUTE MỚI */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/achievements" element={<AdminLayout><AdminAchievementManager /></AdminLayout>} /> {/* <-- ROUTE MỚI */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;