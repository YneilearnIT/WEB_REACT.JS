import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/auth/Login';
import GameConsole from './pages/client/GameConsole';
import Profile from './pages/client/Profile';
import Ranking from './pages/client/Ranking';
import AdminDashboard from './pages/admin/AdminDashboard';
import SocialPanel from './pages/client/SocialPanel';
import RatingPanel from './pages/client/RatingPanel';
import './App.css';

const LogoutButton = () => {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  return (
    <button onClick={handleLogout} style={{ background: 'var(--accent-red)', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
      ĐĂNG XUẤT
    </button>
  );
};

const ClientLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-logo">BOARD GAME</div>
        <div className="navbar-menu">
          <Link to="/">TRANG CHỦ</Link>
          <Link to="/profile">HỒ SƠ</Link>
          <Link to="/ranking">XẾP HẠNG</Link>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'NỀN SÁNG' : 'NỀN TỐI'}
          </button>
          <LogoutButton />
        </div>
      </nav>
      
      <main style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: '30px', padding: '30px 20px', width: '100%', boxSizing: 'border-box' }}>
        {location.pathname === "/" && <RatingPanel />}
        <div style={{ flex: '0 0 auto' }}>{children}</div>
        {location.pathname === "/" && <SocialPanel />}
      </main>

      <footer className="footer">2026 BOARD GAME PROJECT - WEB PROGRAMMING COURSE</footer>
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
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;