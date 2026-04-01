import { useState } from 'react';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{"username": "Người chơi"}'));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.username);

  const handleSave = () => {
    const updatedUser = { ...user, username: editName };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    alert('Đã cập nhật thông tin thành công!');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <h2 style={{ color: '#FB923C', letterSpacing: '2px' }}>QUẢN LÝ HỒ SƠ</h2>
      
      <div style={{ background: 'var(--nav-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '5px' }}>TÊN TÀI KHOẢN</label>
          {isEditing ? (
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              style={{ padding: '8px', width: '100%', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid #38BDF8', borderRadius: '4px' }}
            />
          ) : (
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user.username}</div>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '5px' }}>THÀNH TỰU</label>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
            Bạn chưa có thành tựu nào. Hãy chơi game để nhận thành tựu!
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{ background: '#38BDF8', color: '#0F172A', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>LƯU THAY ĐỔI</button>
            <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>HỦY</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: '#38BDF8', border: '1px solid #38BDF8', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CHỈNH SỬA</button>
        )}
      </div>
    </div>
  );
};

export default Profile;