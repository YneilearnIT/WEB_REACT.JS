import { useState, useEffect } from 'react';

const FAKE_GAMES = [
  { id: 'CARO_5', name: 'CARO HANG 5', enabled: true, size: 10 },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', enabled: true, size: 3 },
  { id: 'SNAKE', name: 'RAN SAN MOI', enabled: false, size: 15 }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('STATS'); // STATS, USERS, GAMES
  const [users, setUsers] = useState([]); // Chuyển thành mảng rỗng ban đầu
  const [games, setGames] = useState(FAKE_GAMES);

  // Kéo dữ liệu người dùng từ Backend khi bấm sang Tab USERS
  useEffect(() => {
    if (activeTab === 'USERS') {
      fetch('http://localhost:5000/api/admin/users')
        .then(res => res.json())
        .then(result => setUsers(result.data || []))
        .catch(err => console.error("Lỗi tải user:", err));
    }
  }, [activeTab]);

  // Hàm gọi API để thay đổi trạng thái user
  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'HOAT DONG' ? 'BI KHOA' : 'HOAT DONG';
    
    // Cập nhật giao diện ngay lập tức cho mượt
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));

    // Bắn API xuống Backend
    try {
      await fetch(`http://localhost:5000/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGameStatus = (id) => {
    setGames(games.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  const changeGameSize = (id, newSize) => {
    setGames(games.map(g => g.id === id ? { ...g, size: Number(newSize) } : g));
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <h2 style={{ color: '#EF4444', letterSpacing: '2px', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
        HE THONG QUAN TRI (ADMIN)
      </h2>

      {/* MENU CHUYỂN TAB */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', marginTop: '20px' }}>
        <button 
          onClick={() => setActiveTab('STATS')}
          style={{ background: activeTab === 'STATS' ? '#EF4444' : 'transparent', color: activeTab === 'STATS' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
        >
          THONG KE
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          style={{ background: activeTab === 'USERS' ? '#EF4444' : 'transparent', color: activeTab === 'USERS' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
        >
          QUAN LY NGUOI DUNG
        </button>
        <button 
          onClick={() => setActiveTab('GAMES')}
          style={{ background: activeTab === 'GAMES' ? '#EF4444' : 'transparent', color: activeTab === 'GAMES' ? '#0F172A' : '#94A3B8', border: '1px solid #EF4444', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
        >
          QUAN LY GAME
        </button>
      </div>

      {/* NỘI DUNG CÁC TAB */}
      <div style={{ background: 'var(--nav-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        
        {/* TAB 1: THỐNG KÊ (Giữ nguyên) */}
        {activeTab === 'STATS' && (
          <div>
            <h3 style={{ color: '#FBBF24' }}>TONG QUAN HE THONG</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>TONG NGUOI CHOI</div>
                <div style={{ color: '#38BDF8', fontSize: '2rem', fontWeight: 'bold' }}>1,245</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>TONG LUOT CHOI</div>
                <div style={{ color: '#10B981', fontSize: '2rem', fontWeight: 'bold' }}>8,930</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold' }}>GAME HOT NHAT</div>
                <div style={{ color: '#EF4444', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '5px' }}>CARO HANG 5</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ NGƯỜI DÙNG (Đã cập nhật dữ liệu thật) */}
        {activeTab === 'USERS' && (
          <div>
            <h3 style={{ color: '#FBBF24', marginBottom: '20px' }}>DANH SACH TAI KHOAN</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', color: '#94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>TEN TAI KHOAN</th>
                  <th style={{ padding: '12px' }}>LUOT CHOI</th>
                  <th style={{ padding: '12px' }}>TRANG THAI</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>HANH DONG</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Chưa có người chơi nào.</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>#{u.id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.username}</td>
                      <td style={{ padding: '12px', color: '#38BDF8', fontWeight: 'bold' }}>{u.matches}</td>
                      <td style={{ padding: '12px', color: u.status === 'HOAT DONG' ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>{u.status}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button 
                          onClick={() => toggleUserStatus(u.id, u.status)}
                          style={{ background: u.status === 'HOAT DONG' ? '#EF4444' : '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          {u.status === 'HOAT DONG' ? 'KHOA' : 'MO KHOA'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ GAME (Giữ nguyên) */}
        {activeTab === 'GAMES' && (
          <div>
            <h3 style={{ color: '#FBBF24', marginBottom: '20px' }}>CAI DAT TRANG THAI GAME</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', color: '#94A3B8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>TEN GAME</th>
                  <th style={{ padding: '12px' }}>KICH THUOC BAN</th>
                  <th style={{ padding: '12px' }}>TRANG THAI</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>HANH DONG</th>
                </tr>
              </thead>
              <tbody>
                {games.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#38BDF8' }}>{g.name}</td>
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number" 
                        value={g.size} 
                        onChange={(e) => changeGameSize(g.id, e.target.value)}
                        style={{ width: '60px', padding: '5px', background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '12px', color: g.enabled ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                      {g.enabled ? 'DANG BAT' : 'DANG TAT'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => toggleGameStatus(g.id)}
                        style={{ background: g.enabled ? '#EF4444' : '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {g.enabled ? 'TAT GAME' : 'BAT GAME'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;