// src/pages/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Chỗ này sau này sẽ gọi API thực tế đến Backend
    // Tạm thời Fake login cho tài khoản player1
    if (username === 'player1' && password === '123456') {
      const fakeUser = { id: 1, username: 'player1', role: 'CLIENT' };
      localStorage.setItem('user', JSON.stringify(fakeUser));
      navigate('/'); // Chuyển hướng vào game
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Đăng Nhập</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Tên tài khoản</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn">Vào Hệ Thống</button>
        </form>
      </div>
    </div>
  );
};

export default Login;