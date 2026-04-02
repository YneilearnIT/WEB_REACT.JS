import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('GAMES'); 
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users_count: 0, matches_count: 0, hot_game: '...' });
  const [games, setGames] = useState([]);
  const [message, setMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', userId: null, currentRole: '' });

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
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) { console.error("Lỗi lấy users:", err); }
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
      if (res.ok) {
        setMessage('Đã cập nhật cấu hình hệ thống thành công!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) { setMessage('Lỗi mạng khi lưu cài đặt'); }
  };

  const requestRoleChange = (id, currentRole) => {
    setConfirmModal({ isOpen: true, type: 'ROLE', userId: id, currentRole });
  };

  const requestDeleteUser = (id) => {
    setConfirmModal({ isOpen: true, type: 'DELETE', userId: id });
  };

  const executeConfirmAction = async () => {
    const { type, userId, currentRole } = confirmModal;
    setConfirmModal({ isOpen: false, type: '', userId: null, currentRole: '' }); 

    if (type === 'ROLE') {
      const newRole = currentRole?.toUpperCase() === 'ADMIN' ? 'CLIENT' : 'ADMIN';
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ role: newRole })
        });
        const data = await res.json();
        setMessage(data.message);
        if (res.ok) fetchUsers(); 
      } catch (err) { setMessage('Lỗi kết nối máy chủ'); }
    } 
    else if (type === 'DELETE') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setMessage(data.message);
        if (res.ok) { fetchUsers(); fetchStats(); }
      } catch (err) { setMessage('Lỗi kết nối máy chủ'); }
    }
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

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: 'white', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* HEADER: Đã xóa nút Đăng Xuất bị lặp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#EF4444', margin: 0, fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          HỆ THỐNG QUẢN TRỊ (ADMIN)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Xin chào, <span style={{ color: '#EF4444' }}>{currentUser.username}</span>
          </span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab('STATS')} style={{ flex: 1, background: activeTab === 'STATS' ? '#EF4444' : 'transparent', color: 'white', border: '1px solid #EF4444', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textTransform: 'uppercase' }}>THỐNG KÊ</button>
        <button onClick={() => setActiveTab('USERS')} style={{ flex: 1, background: activeTab === 'USERS' ? '#EF4444' : 'transparent', color: 'white', border: '1px solid #EF4444', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textTransform: 'uppercase' }}>QUẢN LÝ NGƯỜI DÙNG</button>
        <button onClick={() => setActiveTab('GAMES')} style={{ flex: 1, background: activeTab === 'GAMES' ? '#EF4444' : 'transparent', color: 'white', border: '1px solid #EF4444', padding: '10px 25px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textTransform: 'uppercase' }}>QUẢN LÝ GAME</button>
      </div>

      <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        
        {message && <div style={{ background: '#10B981', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>{message}</div>}

        {activeTab === 'GAMES' && (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
            <thead>
              <tr style={{ color: '#94A3B8', textAlign: 'left', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '0 20px' }}>TÊN GAME</th>
                <th style={{ padding: '0 20px', textAlign: 'center' }}>KÍCH THƯỚC BÀN</th>
                <th style={{ padding: '0 20px', textAlign: 'center' }}>TRẠNG THÁI</th>
                <th style={{ padding: '0 20px', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {games.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>Đang tải cấu hình game...</td></tr>
              ) : (
                games.map(g => (
                  <tr key={g.id} style={{ background: '#1F2937' }}>
                    <td style={{ padding: '15px 20px', borderRadius: '8px 0 0 8px', color: '#60A5FA', fontWeight: 'bold', fontSize: '1.05rem' }}>{g.name}</td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <input type="number" value={g.size} onChange={(e) => changeGameSize(g.id, e.target.value)} style={{ width: '60px', padding: '8px', background: '#0F172A', color: 'white', border: '1px solid #374151', borderRadius: '4px', textAlign: 'center', outline: 'none', fontWeight: 'bold' }} />
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <span style={{ color: g.enabled ? '#60A5FA' : '#EF4444', fontWeight: 'bold', textTransform: 'uppercase' }}>{g.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>
                      <button onClick={() => toggleGameStatus(g.id)} style={{ background: g.enabled ? '#EF4444' : '#10B981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', minWidth: '110px' }}>
                        {g.enabled ? 'TẮT GAME' : 'BẬT GAME'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'STATS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ background: '#1F2937', padding: '25px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>TỔNG NGƯỜI CHƠI</div>
              <div style={{ color: '#60A5FA', fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.users_count || 0}</div>
            </div>
            <div style={{ background: '#1F2937', padding: '25px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>TỔNG LƯỢT CHƠI</div>
              <div style={{ color: '#10B981', fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.matches_count || 0}</div>
            </div>
            <div style={{ background: '#1F2937', padding: '25px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>GAME HOT NHẤT</div>
              <div style={{ color: '#FBBF24', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '15px' }}>{stats.hot_game}</div>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 20px' }}>ID</th>
                <th style={{ padding: '12px 20px' }}>TÊN TÀI KHOẢN</th>
                <th style={{ padding: '12px 20px' }}>QUYỀN</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>Không có dữ liệu người dùng.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} style={{ background: '#1F2937' }}>
                    <td style={{ padding: '12px 20px', borderRadius: '8px 0 0 8px' }}>#{u.id}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{u.username}</td>
                    <td style={{ padding: '12px 20px', color: u.role?.toUpperCase() === 'ADMIN' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{u.role?.toUpperCase() || 'CLIENT'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>
                      {currentUser.id !== u.id && (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button onClick={() => requestRoleChange(u.id, u.role)} style={{ background: '#FBBF24', color: '#0F172A', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>ĐỔI QUYỀN</button>
                          <button onClick={() => requestDeleteUser(u.id)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>XÓA</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: '30px', textAlign: 'center', color: '#EF4444', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
        CẢNH BÁO: CHỈ ADMIN MỚI CÓ QUYỀN TRUY CẬP CHỨC NĂNG NÀY!
      </div>

      {/* POPUP XÁC NHẬN */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1E293B', padding: '25px', borderRadius: '12px', border: `2px solid ${confirmModal.type === 'DELETE' ? '#EF4444' : '#FBBF24'}`, textAlign: 'center', width: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <h3 style={{ color: confirmModal.type === 'DELETE' ? '#EF4444' : '#FBBF24', marginTop: 0, letterSpacing: '1px' }}>
              {confirmModal.type === 'DELETE' ? 'CẢNH BÁO XÓA' : 'XÁC NHẬN ĐỔI QUYỀN'}
            </h3>
            <div style={{ color: 'white', marginBottom: '25px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {confirmModal.type === 'DELETE' 
                ? 'Xóa người dùng này sẽ xóa toàn bộ lịch sử chơi và tin nhắn của họ. Không thể khôi phục. Bạn có chắc chắn?'
                : `Bạn có chắc muốn đổi quyền người dùng này thành ${confirmModal.currentRole?.toUpperCase() === 'ADMIN' ? 'CLIENT' : 'ADMIN'}?`
              }
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={executeConfirmAction} style={{ background: confirmModal.type === 'DELETE' ? '#EF4444' : '#FBBF24', color: confirmModal.type === 'DELETE' ? 'white' : '#0F172A', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                XÁC NHẬN
              </button>
              <button onClick={() => setConfirmModal({ isOpen: false, type: '', userId: null, currentRole: '' })} style={{ background: 'transparent', color: '#94A3B8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                HỦY BỎ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;