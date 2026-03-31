import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const Login = () => {
  const [isLogin, setIsLogin] = useState(true); // Trạng thái chuyển đổi Đăng nhập / Đăng ký
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // BẮT BUỘC THEO RUBRIC: INPUT VALIDATION CHO ĐĂNG KÝ
    if (!isLogin) {
      if (username.trim().length < 3) {
        return setError('TÊN TÀI KHOẢN PHẢI CÓ ÍT NHẤT 3 KÝ TỰ');
      }
      if (password.length < 6) {
        return setError('MẬT KHẨU PHẢI CÓ ÍT NHẤT 6 KÝ TỰ');
      }
      if (password !== confirmPassword) {
        return setError('MẬT KHẨU XÁC NHẬN KHÔNG KHỚP');
      }
    }

    try {
      // GỌI API THỰC TẾ XUỐNG BACKEND NODE.JS
      const endpoint = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'LỖI KẾT NỐI MÁY CHỦ');
      }

      if (isLogin) {
        // ĐĂNG NHẬP THÀNH CÔNG
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // Lưu JWT Token
        
        if (data.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // ĐĂNG KÝ THÀNH CÔNG
        setSuccess('ĐĂNG KÝ THÀNH CÔNG! VUI LÒNG ĐĂNG NHẬP.');
        setIsLogin(true); // Tự động chuyển về form đăng nhập
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">{isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</h2>
        
        {error && <div className="error-message" style={{ fontWeight: 'bold' }}>{error}</div>}
        {success && <div style={{ color: '#10B981', textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>TÊN TÀI KHOẢN</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>MẬT KHẨU</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>XÁC NHẬN MẬT KHẨU</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? 'VÀO HỆ THỐNG' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            {isLogin ? 'CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY' : 'ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;