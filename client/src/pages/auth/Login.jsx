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

    // --- BẮT BUỘC THEO RUBRIC: INPUT VALIDATION ---
    // Kiểm tra chung cho cả Đăng ký và Đăng nhập
    if (username.trim().length < 3) {
      setError('TÊN TÀI KHOẢN PHẢI CÓ ÍT NHẤT 3 KÝ TỰ');
      return; 
    }
    if (password.length < 6) {
      setError('MẬT KHẨU PHẢI CÓ ÍT NHẤT 6 KÝ TỰ');
      return;
    }

    // Kiểm tra riêng cho form Đăng ký
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('MẬT KHẨU XÁC NHẬN KHÔNG KHỚP');
        return;
      }
    }

    try {
      // GỌI API XUỐNG BACKEND NODE.JS
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
        // --- XỬ LÝ ĐĂNG NHẬP THÀNH CÔNG ---
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token); // Lưu JWT Token
        
        // Phân quyền điều hướng (Đảm bảo không phân biệt hoa/thường)
        if (data.user.role && data.user.role.toUpperCase() === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/'); // Chuyển về trang chơi game của Client
        }
      } else {
        // --- XỬ LÝ ĐĂNG KÝ THÀNH CÔNG ---
        setSuccess('ĐĂNG KÝ THÀNH CÔNG! VUI LÒNG ĐĂNG NHẬP.');
        setIsLogin(true); // Tự động lật về form đăng nhập
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Hàm xử lý khi bấm đổi chế độ (Xóa trắng các trường để tránh lỗi vặt)
  const toggleMode = () => {
    setIsLogin(!isLogin); 
    setError(''); 
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">{isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</h2>
        
        {error && <div className="error-message" style={{ color: '#EF4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
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
            {isLogin ? 'Start Game' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            onClick={toggleMode}
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