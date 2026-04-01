import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: KHI DEMO TRÊN MÁY KHÁC, ĐỔI 'localhost' THÀNH ĐỊA CHỈ IP CỦA MÁY CHỦ (VD: '192.168.1.x')
const API_BASE_URL = 'http://localhost:5000';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('STATS'); 
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users_count: 0, reviews_count: 0 });
  const [message, setMessage] = useState('');
  const [games, setGames] = useState([]); // Sẽ được tải từ API

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || currentUser.role?.toUpperCase() !== 'ADMIN') {
      navigate('/login');
    } else {
      fetchStats();
      fetchUsers();
      fetchGamesConfig();
    }
  }, [navigate, token]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchGamesConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/games/config`);
      if (res.ok) setGames(await res.json());
    } catch (err) { console.error("Lỗi tải cấu hình:", err); }
  };

  const saveConfigToAPI = async (newGamesArray) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/games/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ config: newGamesArray })
      });
      if (res.ok) setMessage('Đã đồng bộ cài đặt Game lên Server');
    } catch (err) { setMessage('Lỗi mạng khi lưu cài đặt'); }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole?.toUpperCase() === 'ADMIN' ? 'CLIENT' : 'ADMIN';
    if (!window.confirm(`Xác nhận đổi quyền người dùng này thành ${newRole}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/role`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) fetchUsers(); 
    } catch (err) { setMessage('Lỗi kết nối máy chủ'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa người dùng này không thể khôi phục?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) { fetchUsers(); fetchStats(); }
    } catch (err) { setMessage('Lỗi kết nối máy chủ'); }
  };

  const toggleGameStatus = (id) => {
    const newGames = games.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g);
    setGames(newGames);
    saveConfigToAPI(newGames);
  };

  const changeGameSize = (id, newSize) => {
    const newGames = games.map(g => g.id === id ? { ...g, size: Number(newSize) } : g);
    setGames(newGames);
    saveConfigToAPI(newGames);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login');
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
        <h2 style={{ color: '#EF4444', letterSpacing: '2px', margin: 0 }}>HE THONG QUAN TRI (ADMIN)</h2>
        <div>
          <span style={{ marginRight: '15px', fontWeight: 'bold' }}>Xin chào, {currentUser.username}</span>
          <button onClick={handleLogout} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ĐĂNG XUẤT</button>
        </div>
      </div>

      {message && <div style={{ marginTop: '15px', padding: '10px', background: '#10B981', color: 'white', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold' }}>{message}</div>}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', marginTop: '20px' }}>
        <button onClick={() => setActiveTab('STATS')} style={{ background: activeTab === 'STATS' ? '#EF4444' : 'transparent', color: activeTab === 'STATS' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>THONG KE</button>
        <button onClick={() => setActiveTab('USERS')} style={{ background: activeTab === 'USERS' ? '#EF4444' : 'transparent', color: activeTab === 'USERS' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>QUAN LY NGUOI DUNG</button>
        <button onClick={() => setActiveTab('GAMES')} style={{ background: activeTab === 'GAMES' ? '#EF4444' : 'transparent', color: activeTab === 'GAMES' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>QUAN LY GAME</button>
      </div>

      <div style={{ background: 'var(--nav-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        {activeTab === 'STATS' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}><div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px' }}>TONG NGUOI CHOI</div><div style={{ color: '#38BDF8', fontSize: '2rem', fontWeight: 'bold' }}>{stats.users_count || 0}</div></div>
            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}><div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px' }}>TONG LUOT DANH GIA</div><div style={{ color: '#10B981', fontSize: '2rem', fontWeight: 'bold' }}>{stats.reviews_count || 0}</div></div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-color)', color: '#94A3B8', textAlign: 'left' }}><th style={{ padding: '12px' }}>ID</th><th style={{ padding: '12px' }}>TÊN TÀI KHOẢN</th><th style={{ padding: '12px' }}>QUYỀN</th><th style={{ padding: '12px', textAlign: 'right' }}>HÀNH ĐỘNG</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>#{u.id}</td><td style={{ padding: '12px', fontWeight: 'bold' }}>{u.username}</td>
                  <td style={{ padding: '12px', color: u.role?.toUpperCase() === 'ADMIN' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{u.role?.toUpperCase() || 'CLIENT'}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {currentUser.id !== u.id && (
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleRoleChange(u.id, u.role)} style={{ background: '#FBBF24', color: '#0F172A', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ĐỔI QUYỀN</button>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>XÓA</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'GAMES' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-color)', color: '#94A3B8', textAlign: 'left' }}><th style={{ padding: '12px' }}>TÊN GAME</th><th style={{ padding: '12px' }}>KÍCH THƯỚC BÀN</th><th style={{ padding: '12px' }}>TRẠNG THÁI</th><th style={{ padding: '12px', textAlign: 'right' }}>HÀNH ĐỘNG</th></tr></thead>
            <tbody>
              {games.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#38BDF8' }}>{g.name}</td>
                  <td style={{ padding: '12px' }}><input type="number" value={g.size} onChange={(e) => changeGameSize(g.id, e.target.value)} style={{ width: '60px', padding: '5px', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' }} /></td>
                  <td style={{ padding: '12px', color: g.enabled ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>{g.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}><button onClick={() => toggleGameStatus(g.id)} style={{ background: g.enabled ? '#EF4444' : '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{g.enabled ? 'TẮT GAME' : 'BẬT GAME'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;