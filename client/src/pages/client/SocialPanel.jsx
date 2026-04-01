// File: src/pages/client/SocialPanel.jsx
import { useState, useEffect } from 'react';

const SocialPanel = () => {
  const [friends, setFriends] = useState([]); // Chứa danh sách bạn bè
  const [searchUsername, setSearchUsername] = useState('');
  const [chatUser, setChatUser] = useState(null); // Người đang chat cùng
  const [messages, setMessages] = useState([]); // Lịch sử tin nhắn
  const [chatInput, setChatInput] = useState('');

  // TODO: Viết hàm useEffect gọi API GET /api/friends để nạp danh sách bạn bè

  const handleAddFriend = () => {
    // TODO: Gọi API POST /api/friends/add
    alert(`Chưa có logic gửi lời mời kết bạn tới: ${searchUsername}`);
  };

  const handleSendMessage = () => {
    // TODO: Gọi API POST /api/messages
    alert(`Chưa có logic gửi tin nhắn: ${chatInput}`);
  };

  return (
    <div style={{ position: 'fixed', right: 0, top: '60px', width: '300px', height: '100%', background: '#1E293B', borderLeft: '1px solid #334155', padding: '15px', color: 'white' }}>
      <h3 style={{ color: '#38BDF8', marginTop: 0 }}>CỘNG ĐỒNG</h3>
      
      {/* TÌM VÀ KẾT BẠN */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
        <input 
          placeholder="Nhập tên tài khoản..." 
          value={searchUsername} 
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ flex: 1, padding: '5px' }} 
        />
        <button onClick={handleAddFriend} style={{ background: '#10B981', border: 'none', color: 'white', fontWeight: 'bold', padding: '0 10px' }}>KẾT BẠN</button>
      </div>

      {/* DANH SÁCH BẠN BÈ */}
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#94A3B8', marginBottom: '10px' }}>DANH SÁCH BẠN BÈ</div>
        {/* TODO: Map danh sách friends ra đây */}
        <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>Chưa có dữ liệu. Hãy viết logic tải danh sách.</div>
      </div>

      {/* KHUNG CHAT RỖNG */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '300px', background: '#0F172A', border: '1px solid #334155' }}>
        <div style={{ background: '#334155', padding: '5px', fontWeight: 'bold', textAlign: 'center' }}>KHUNG CHAT</div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {/* TODO: Map danh sách messages ra đây */}
          <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>Chọn một người bạn để bắt đầu trò chuyện.</div>
        </div>
        
        <div style={{ display: 'flex' }}>
          <input 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Nhập tin nhắn..." 
            style={{ flex: 1, padding: '5px', border: 'none' }} 
          />
          <button onClick={handleSendMessage} style={{ background: '#38BDF8', border: 'none', padding: '5px 10px', fontWeight: 'bold' }}>GỬI</button>
        </div>
      </div>
    </div>
  );
};

export default SocialPanel;