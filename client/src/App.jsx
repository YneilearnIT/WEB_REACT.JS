import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/auth/Login";
import GameConsole from "./pages/client/GameConsole";
import Profile from "./pages/client/Profile";
import Ranking from "./pages/client/Ranking";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SocialPanel from "./pages/client/SocialPanel";
import "./App.css";

// NÚT ĐĂNG XUẤT DÙNG CHUNG
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

// LAYOUT NGƯỜI CHƠI
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
          <Link
            to="/"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            TRANG CHỦ
          </Link>
          <Link
            to="/profile"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            HỒ SƠ
          </Link>
          <Link
            to="/ranking"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            XẾP HẠNG
          </Link>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "NỀN SÁNG" : "NỀN TỐI"}
          </button>
          <LogoutButton />
        </div>
      </nav>

      {/* KHU VỰC CHÍNH CỦA MÀN HÌNH */}
      <main
        className="main-content"
        style={{
          display: "flex",
          flexDirection: "row",
          padding: "30px 20px",
          overflow: "hidden",
          justifyContent: "center",
          alignItems:
            "stretch" /* Tuyệt chiêu ép mép trên và mép dưới bằng chằn chặn */,
          gap: "40px" /* Khoảng cách giữa máy Game và Chat */,
        }}
      >
        {/* Máy Game hoặc Trang nội dung */}
        {children}

        {/* Khung Chat */}
        <SocialPanel />
      </main>

      <footer className="footer">
        2026 BOARD GAME PROJECT - WEB PROGRAMMING COURSE
      </footer>
    </div>
  );
};

// LAYOUT QUẢN TRỊ VIÊN
const AdminLayout = ({ children }) => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div
      className="layout-container"
      style={{ borderTop: "5px solid #EF4444" }}
    >
      <nav className="navbar" style={{ background: "#0F172A" }}>
        <div className="navbar-logo" style={{ color: "#EF4444" }}>
          ADMIN PORTAL
        </div>
        <div className="navbar-menu">
          <Link
            to="/admin"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            DASHBOARD
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <main
        className="main-content"
        style={{ alignItems: "flex-start", padding: "20px" }}
      >
        {children}
      </main>
      <footer
        className="footer"
        style={{ background: "#0F172A", color: "#EF4444" }}
      >
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

        {/* NHÓM ROUTE NGƯỜI DÙNG */}
        <Route
          path="/"
          element={
            <ClientLayout>
              <GameConsole />
            </ClientLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ClientLayout>
              <Profile />
            </ClientLayout>
          }
        />
        <Route
          path="/ranking"
          element={
            <ClientLayout>
              <Ranking />
            </ClientLayout>
          }
        />

        {/* NHÓM ROUTE ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
