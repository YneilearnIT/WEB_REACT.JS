import { useState, useEffect, useRef } from 'react';

const SocialPanel = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [friends, setFriends] = useState([]); 
  const [requests, setRequests] = useState([]); 
  const [searchUsername, setSearchUsername] = useState('');
  const [chatUser, setChatUser] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');
  const [sysMsg, setSysMsg] = useState('');

  const [userToDelete, setUserToDelete] = useState(null);
  const pressTimer = useRef(null);
  const chatContainerRef = useRef(null);

  // --- STATE PHÂN TRANG (PAGINATION) ---
  const [friendPage, setFriendPage] = useState(1);
  const friendsPerPage = 4; // Hiện 4 bạn / 1 trang cho gọn
  
  const [msgPage, setMsgPage] = useState(1);
  const msgsPerPage = 10; // Hiện 10 tin nhắn / 1 trang

  // 1. LOAD DỮ LIỆU BẠN BÈ VÀ LỜI MỜI ĐỊNH KỲ
  useEffect(() => {
    if (!user.id) return;
    const fetchSocialData = async () => {
      try {
        const [fRes, rRes] = await Promise.all([
          fetch(`http://localhost:5000/api/friends/${user.id}`),
          fetch(`http://localhost:5000/api/friends/requests/${user.id}`)
        ]);
        if (fRes.ok) {
          const fData = await fRes.json();
          setFriends(fData.data || []);
        }
        if (rRes.ok) {
          const rData = await rRes.json();
          setRequests(rData || []);
        }
      } catch (err) { console.error(err); }
    };
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  // 2. LOAD TIN NHẮN THEO THỜI GIAN THỰC
  useEffect(() => {
    if (!user.id || !chatUser) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${user.id}/${chatUser.id}`);
        if (res.ok) {
          const result = await res.json();
          setMessages(result.data || []);
          // Chỉ tự động cuộn xuống đáy nếu đang ở trang 1 (trang mới nhất)
          if (msgPage === 1 && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }
      } catch (err) {}
    };
    fetchMessages(); 
    const interval = setInterval(fetchMessages, 2000); 
    return () => clearInterval(interval);
  }, [chatUser, user.id, msgPage]);

  // 3. THÊM BẠN
  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return;
    setSysMsg('Đang xử lý...');
    try {
      const res = await fetch('http://localhost:5000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, friend_username: searchUsername.trim() })
      });
      const data = await res.json();
      setSysMsg(data.message);
      if (res.ok) setSearchUsername('');
      setTimeout(() => setSysMsg(''), 4000); // Ẩn thông báo sau 4s
    } catch (err) { setSysMsg('Lỗi kết nối server!'); }
  };

  // 4. DUYỆT / TỪ CHỐI LỜI MỜI
  const acceptRequest = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
      });
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
    } catch (err) {}
  };

  const rejectRequest = async (senderId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/${user.id}/${senderId}`, { method: 'DELETE' });
      setRequests(prev => prev.filter(r => r.sender_id !== senderId));
    } catch (err) {}
  };

  // 5. XÓA BẠN (NHẤN GIỮ 600ms)
  const handlePressStart = (friend) => {
    pressTimer.current = setTimeout(() => setUserToDelete(friend), 600); 
  };
  const handlePressEnd = () => { 
    if (pressTimer.current) clearTimeout(pressTimer.current); 
  };

  const confirmRemoveFriend = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id;
    setUserToDelete(null); 
    
    setFriends(prev => prev.filter(f => f.id !== targetId));
    if (chatUser && chatUser.id === targetId) { setChatUser(null); setMessages([]); }

    try {
      await fetch(`http://localhost:5000/api/friends/${user.id}/${targetId}`, { method: 'DELETE' });
    } catch (err) {}
  };

  // 6. GỬI TIN NHẮN
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatUser) return;
    const tempMsg = chatInput;
    setChatInput(''); 
    try {
      await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, receiver_id: chatUser.id, content: tempMsg })
      });
      setMsgPage(1); // Gửi xong thì reset về trang 1 để thấy tin mới nhất
    } catch (err) {}
  };

  // --- LOGIC CẮT MẢNG PHÂN TRANG ---
  const totalFriendPages = Math.ceil(friends.length / friendsPerPage) || 1;
  const currentFriends = friends.slice((friendPage - 1) * friendsPerPage, friendPage * friendsPerPage);

  const totalMsgPages = Math.ceil(messages.length / msgsPerPage) || 1;
  // Lấy tin nhắn từ dưới lên trên (mới nhất nằm ở page 1)
  const reversedMessages = [...messages].reverse(); 
  const currentMessages = reversedMessages.slice((msgPage - 1) * msgsPerPage, msgPage * msgsPerPage).reverse();


  if (!user.id) return null;

  return (
    <div style={{ width: '350px', height: '650px', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      
      <h2 style={{ color: '#38BDF8', marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px', textAlign: 'center', fontSize: '1.3rem' }}>
        KẾT BẠN & TRÒ CHUYỆN
      </h2>
      
      {/* KHU VỰC THÊM BẠN CẢI TIẾN */}
      <div style={{ position: 'relative', marginBottom: '15px', marginTop: '5px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            placeholder="Nhập tên tài khoản..." 
            value={searchUsername} 
            onChange={(e) => setSearchUsername(e.target.value)}
            style={{ flex: 1, padding: '8px 10px', background: '#0F172A', color: 'white', border: '1px solid #334155', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }} 
          />
          <button onClick={handleAddFriend} style={{ background: '#10B981', border: 'none', color: 'white', fontWeight: 'bold', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            THÊM
          </button>
        </div>
        
        {/* THÔNG BÁO SIÊU NHỎ, NẰM GỌN TRONG KHUNG */}
        {sysMsg && (
          <div style={{ fontSize: '0.75rem', color: '#FBBF24', marginTop: '6px', fontStyle: 'italic', textAlign: 'center' }}>
            * {sysMsg}
          </div>
        )}
      </div>

      {/* LỜI MỜI CHỜ DUYỆT */}
      {requests.length > 0 && (
        <div style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', color: '#10B981', fontSize: '0.85rem', marginBottom: '8px' }}>LỜI MỜI CHỜ DUYỆT ({requests.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '80px', overflowY: 'auto' }}>
            {requests.map(req => (
              <div key={req.request_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', padding: '8px 10px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>{req.username}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => acceptRequest(req.request_id)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => rejectRequest(req.sender_id)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH BẠN BÈ (CÓ PHÂN TRANG) */}
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#94A3B8', fontSize: '0.85rem' }}>BẠN BÈ ({friends.length})</span>
          <span style={{ fontSize: '0.7rem', color: '#EF4444', fontStyle: 'italic' }}>*Nhấn giữ để xóa</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '130px' }}>
          {currentFriends.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>Chưa có bạn bè nào.</div>
          ) : (
            currentFriends.map(f => (
              <div 
                key={f.id} 
                onClick={() => { setChatUser(f); setMsgPage(1); }} // Reset trang tin nhắn
                onMouseDown={() => handlePressStart(f)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(f)}
                onTouchEnd={handlePressEnd}
                style={{ 
                  padding: '10px', 
                  background: chatUser?.id === f.id ? '#38BDF8' : '#0F172A', 
                  color: chatUser?.id === f.id ? '#0F172A' : 'white', 
                  cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem',
                  userSelect: 'none', transition: 'background 0.2s'
                }}
              >
                {f.username}
              </div>
            ))
          )}
        </div>

        {/* Nút Phân trang Bạn bè */}
        {totalFriendPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem' }}>
            <button disabled={friendPage === 1} onClick={() => setFriendPage(p => p - 1)} style={{ background: 'transparent', border: '1px solid #334155', color: friendPage === 1 ? '#64748B' : '#38BDF8', padding: '2px 8px', borderRadius: '4px', cursor: friendPage === 1 ? 'not-allowed' : 'pointer' }}>◀</button>
            <span style={{ color: '#94A3B8' }}>{friendPage} / {totalFriendPages}</span>
            <button disabled={friendPage === totalFriendPages} onClick={() => setFriendPage(p => p + 1)} style={{ background: 'transparent', border: '1px solid #334155', color: friendPage === totalFriendPages ? '#64748B' : '#38BDF8', padding: '2px 8px', borderRadius: '4px', cursor: friendPage === totalFriendPages ? 'not-allowed' : 'pointer' }}>▶</button>
          </div>
        )}
      </div>

      {/* KHUNG TRÒ CHUYỆN (CÓ PHÂN TRANG) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: '#334155', padding: '8px 10px', fontWeight: 'bold', fontSize: '0.85rem', color: '#FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{chatUser ? `CHAT: ${chatUser.username}` : 'CHỌN BẠN'}</span>
          
          {/* Nút Phân trang Tin nhắn (Góc phải tiêu đề) */}
          {chatUser && totalMsgPages > 1 && (
             <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
               <button disabled={msgPage === totalMsgPages} onClick={() => setMsgPage(p => p + 1)} title="Cũ hơn" style={{ background: 'transparent', border: 'none', color: msgPage === totalMsgPages ? '#64748B' : 'white', cursor: msgPage === totalMsgPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>▲</button>
               <span style={{ color: 'white', fontSize: '0.75rem' }}>{msgPage}/{totalMsgPages}</span>
               <button disabled={msgPage === 1} onClick={() => setMsgPage(p => p - 1)} title="Mới hơn" style={{ background: 'transparent', border: 'none', color: msgPage === 1 ? '#64748B' : 'white', cursor: msgPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>▼</button>
             </div>
          )}
        </div>
        
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!chatUser ? (
            <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>Vui lòng chọn bạn bè.</div>
          ) : currentMessages.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', marginTop: '20px' }}>Hãy gửi lời chào!</div>
          ) : (
            currentMessages.map(msg => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} style={{ 
                  alignSelf: isMine ? 'flex-end' : 'flex-start', 
                  background: isMine ? '#38BDF8' : '#1E293B', 
                  color: isMine ? '#0F172A' : 'white', 
                  padding: '6px 12px', borderRadius: '12px', 
                  maxWidth: '85%', fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: '1.4'
                }}>
                  {msg.content}
                </div>
              );
            })
          )}
        </div>
        
        <div style={{ display: 'flex', borderTop: '1px solid #334155' }}>
          <input 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={chatUser ? "Nhập tin nhắn..." : "..."} 
            disabled={!chatUser}
            style={{ flex: 1, padding: '10px', background: 'transparent', color: 'white', border: 'none', outline: 'none', fontSize: '0.85rem' }} 
          />
          <button onClick={handleSendMessage} disabled={!chatUser} style={{ background: chatUser ? '#38BDF8' : '#334155', border: 'none', padding: '0 12px', fontWeight: 'bold', color: '#0F172A', cursor: chatUser ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>GỬI</button>
        </div>
      </div>

      {/* POPUP XÁC NHẬN XÓA BẠN BÈ */}
      {userToDelete && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, borderRadius: '12px' }}>
          <div style={{ background: '#1E293B', padding: '20px', borderRadius: '8px', border: '2px solid #EF4444', textAlign: 'center', width: '85%' }}>
            <div style={{ color: 'white', marginBottom: '15px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Xóa bạn với <strong style={{color: '#EF4444', fontSize: '1rem'}}>{userToDelete.username}</strong>?
              <br/><span style={{fontSize: '0.75rem', color: '#94A3B8'}}>(Toàn bộ tin nhắn sẽ bị xóa)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={confirmRemoveFriend} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>XÓA</button>
              <button onClick={() => setUserToDelete(null)} style={{ background: '#64748B', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>HỦY</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SocialPanel;