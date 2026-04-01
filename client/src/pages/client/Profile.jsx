import { useState, useEffect } from 'react';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{"username": "Người chơi"}'));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.username);
  const [notification, setNotification] = useState('');
  
  // STATE: Quản lý danh sách thành tựu
  const [achievements, setAchievements] = useState([]);

  // EFFECT: Gọi API lấy thành tựu khi vào trang
  useEffect(() => {
    if (!user.id) return;
    const fetchAchievements = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/achievements`);
        const result = await res.json();
        if (res.ok) setAchievements(result.data || []);
      } catch (err) {
        console.error("Lỗi tải thành tựu:", err);
      }
    };
    fetchAchievements();
  }, [user.id]);

  const handleSave = async () => {
    // 1. Kiểm tra rỗng
    if (!editName.trim()) {
      setNotification('Tên tài khoản không được để trống!');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    try {
      // 2. Bắn API xuống Backend để cập nhật Database
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_username: editName })
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Tên bị trùng hoặc lỗi
        setNotification(data.message || 'Lỗi đổi tên!');
        setTimeout(() => setNotification(''), 3000);
        return;
      }

      // 3. Nếu DB cập nhật thành công, mới lưu vào LocalStorage
      const updatedUser = { ...user, username: editName.trim() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      
      setNotification('Đã cập nhật thông tin trên toàn hệ thống!');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setNotification('Không thể kết nối đến máy chủ!');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <h2 style={{ color: '#FB923C', letterSpacing: '2px' }}>QUẢN LÝ HỒ SƠ</h2>
      
      {notification && (
        <div style={{ 
          background: notification.includes('không') || notification.includes('Lỗi') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
          color: notification.includes('không') || notification.includes('Lỗi') ? '#EF4444' : '#10B981', 
          border: `1px solid ${notification.includes('không') || notification.includes('Lỗi') ? '#EF4444' : '#10B981'}`, 
          padding: '10px 15px', 
          borderRadius: '6px', 
          marginTop: '15px', 
          fontWeight: 'bold',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {notification}
        </div>
      )}

      <div style={{ background: 'var(--nav-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '5px' }}>TÊN TÀI KHOẢN</label>
          {isEditing ? (
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              style={{ padding: '8px', width: '100%', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid #38BDF8', borderRadius: '4px', outline: 'none' }}
            />
          ) : (
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user.username}</div>
          )}
        </div>

        {/* KHU VỰC HIỂN THỊ THÀNH TỰU ĐỘNG */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '10px', fontWeight: 'bold' }}>THÀNH TỰU ĐÃ ĐẠT</label>
          
          {achievements.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
              Bạn chưa có thành tựu nào. Hãy chơi game để nhận thành tựu!
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {achievements.map(ach => (
                <div key={ach.id} style={{ 
                  background: 'var(--bg-color)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  minWidth: '220px',
                  flex: '1 1 auto'
                }}>
                  <div style={{ fontSize: '2rem' }}>{ach.icon}</div>
                  <div>
                    <div style={{ color: '#FBBF24', fontWeight: 'bold', fontSize: '0.95rem' }}>{ach.name}</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '3px' }}>{ach.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{ background: '#38BDF8', color: '#0F172A', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>LƯU THAY ĐỔI</button>
            <button onClick={() => { setIsEditing(false); setEditName(user.username); }} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>HỦY</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: '#38BDF8', border: '1px solid #38BDF8', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CHỈNH SỬA</button>
        )}
      </div>
    </div>
  );
};

export default Profile;