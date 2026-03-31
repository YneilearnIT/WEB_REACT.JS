import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/auth/Login';
import GameConsole from './pages/client/GameConsole';
import Profile from './pages/client/Profile';   // IMPORT TRANG PROFILE
import Ranking from './pages/client/Ranking';   // IMPORT TRANG RANKING
import './App.css';

const ClientLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-logo">RETRO BOARD</div>
        <div className="navbar-menu">
          <Link to="/" style={{color: 'inherit', textDecoration: 'none', fontWeight: 'bold'}}>HOME</Link>
          <Link to="/profile" style={{color: 'inherit', textDecoration: 'none', fontWeight: 'bold'}}>PROFILE</Link>
          <Link to="/ranking" style={{color: 'inherit', textDecoration: 'none', fontWeight: 'bold'}}>RANKING</Link>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'LIGHT THEME' : 'DARK THEME'}
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        2026 BOARD GAME PROJECT - WEB PROGRAMMING COURSE
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* CÁC ROUTE NẰM TRONG LAYOUT CỦA CLIENT */}
        <Route path="/" element={<ClientLayout><GameConsole /></ClientLayout>} />
        <Route path="/profile" element={<ClientLayout><Profile /></ClientLayout>} />
        <Route path="/ranking" element={<ClientLayout><Ranking /></ClientLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;