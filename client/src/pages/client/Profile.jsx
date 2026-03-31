import { useState } from 'react';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{"username": "PLAYER1"}'));
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.username);

  const handleSave = () => {
    const updatedUser = { ...user, username: editName };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    alert('DA CAP NHAT THONG TIN');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <h2 style={{ color: '#FB923C', letterSpacing: '2px' }}>QUAN LY PROFILE</h2>
      
      <div style={{ background: 'var(--nav-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '5px' }}>TEN TAI KHOAN</label>
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

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: '#94A3B8', marginBottom: '5px' }}>THANH TUU (DEMO)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ padding: '5px 10px', background: '#38BDF8', color: '#0F172A', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>THANG 10 VAN CARO</span>
            <span style={{ padding: '5px 10px', background: '#FBBF24', color: '#0F172A', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>CHOI 100 GIO</span>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{ background: '#38BDF8', color: '#0F172A', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>LUU THAY DOI</button>
            <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>HUY</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: '#38BDF8', border: '1px solid #38BDF8', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CHINH SUA</button>
        )}
      </div>
    </div>
  );
};

export default Profile;