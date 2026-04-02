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

  const [friendPage, setFriendPage] = useState(1);
  const friendsPerPage = 4; 
  const [msgPage, setMsgPage] = useState(1);
  const msgsPerPage = 10; 

  useEffect(() => {
    if (!user.id || user.role?.toUpperCase() === 'ADMIN') return;
    const fetchSocialData = async () => {
      try {
        const [fRes, rRes] = await Promise.all([
          fetch(`http://localhost:5000/api/friends/${user.id}`),
          fetch(`http://localhost:5000/api/friends/requests/${user.id}`)
        ]);
        if (fRes.ok) { setFriends((await fRes.json()).data || []); }
        if (rRes.ok) { setRequests(await rRes.json() || []); }
      } catch (err) {}
    };
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  useEffect(() => {
    if (!user.id || !chatUser || user.role?.toUpperCase() === 'ADMIN') return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/messages/${user.id}/${chatUser.id}`);
        if (res.ok) {
          const result = await res.json();
          setMessages(result.data || []);
          if (msgPage === 1 && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }
      } catch (err) {}
    };
    fetchMessages(); 
    const interval = setInterval(fetchMessages, 2000); 
    return () => clearInterval(interval);
  }, [chatUser, user.id, msgPage, user.role]);

  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return;
    setSysMsg('Đang xử lý...');
    try {
      const res = await fetch('http://localhost:5000/api/friends/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, friend_username: searchUsername.trim() })
      });
      const data = await res.json();
      setSysMsg(data.message);
      if (res.ok) setSearchUsername('');
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err) { setSysMsg('Lỗi!'); }
  };

  const acceptRequest = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/accept`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: requestId }) });
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
    } catch (err) {}
  };

  const rejectRequest = async (senderId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/${user.id}/${senderId}`, { method: 'DELETE' });
      setRequests(prev => prev.filter(r => r.sender_id !== senderId));
    } catch (err) {}
  };

  const handlePressStart = (friend) => { pressTimer.current = setTimeout(() => setUserToDelete(friend), 600); };
  const handlePressEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const confirmRemoveFriend = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id; setUserToDelete(null); 
    setFriends(prev => prev.filter(f => f.id !== targetId));
    if (chatUser && chatUser.id === targetId) { setChatUser(null); setMessages([]); }
    try { await fetch(`http://localhost:5000/api/friends/${user.id}/${targetId}`, { method: 'DELETE' }); } catch (err) {}
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatUser) return;
    const tempMsg = chatInput; setChatInput(''); 
    try {
      await fetch('http://localhost:5000/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user.id, receiver_id: chatUser.id, content: tempMsg }) });
      setMsgPage(1);
    } catch (err) {}
  };

  const totalFriendPages = Math.ceil(friends.length / friendsPerPage) || 1;
  const currentFriends = friends.slice((friendPage - 1) * friendsPerPage, friendPage * friendsPerPage);
  const totalMsgPages = Math.ceil(messages.length / msgsPerPage) || 1;
  const currentMessages = [...messages].reverse().slice((msgPage - 1) * msgsPerPage, msgPage * msgsPerPage).reverse();

  if (!user.id || user.role?.toUpperCase() === 'ADMIN') return null;

  return (
    <div style={{ width: '340px', height: '680px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', color: 'var(--text-main)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', transition: '0.3s' }}>
      <h2 style={{ color: 'var(--accent-blue)', marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', textAlign: 'center', fontSize: '1.2rem' }}>
        CHAT
      </h2>
      
      <div style={{ position: 'relative', marginBottom: '15px', marginTop: '5px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input placeholder="Tên tài khoản..." value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }} />
          <button onClick={handleAddFriend} style={{ background: 'var(--accent-green)', border: 'none', color: 'white', fontWeight: 'bold', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>THÊM</button>
        </div>
        {sysMsg && <div style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginTop: '6px', fontStyle: 'italic', textAlign: 'center' }}>* {sysMsg}</div>}
      </div>

      {requests.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-green)', fontSize: '0.85rem', marginBottom: '8px' }}>LỜI MỜI ({requests.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '80px', overflowY: 'auto' }}>
            {requests.map(req => (
              <div key={req.request_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', padding: '8px 10px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-main)' }}>{req.username}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => acceptRequest(req.request_id)} style={{ background: 'var(--accent-green)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => rejectRequest(req.sender_id)} style={{ background: 'var(--accent-red)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.85rem' }}>BẠN BÈ ({friends.length})</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontStyle: 'italic' }}>*Nhấn giữ để xóa</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '130px' }}>
          {currentFriends.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>Chưa có bạn bè.</div>
          ) : (
            currentFriends.map(f => (
              <div 
                key={f.id} onClick={() => { setChatUser(f); setMsgPage(1); }} onMouseDown={() => handlePressStart(f)} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={() => handlePressStart(f)} onTouchEnd={handlePressEnd}
                style={{ padding: '10px', background: chatUser?.id === f.id ? 'var(--accent-blue)' : 'var(--bg-app)', color: chatUser?.id === f.id ? 'white' : 'var(--text-main)', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', userSelect: 'none', transition: '0.2s' }}
              >
                {f.username}
              </div>
            ))
          )}
        </div>
        {totalFriendPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem' }}>
            <button disabled={friendPage === 1} onClick={() => setFriendPage(p => p - 1)} style={{ background: 'transparent', border: 'none', color: friendPage === 1 ? 'var(--text-muted)' : 'var(--accent-blue)', cursor: friendPage === 1 ? 'not-allowed' : 'pointer' }}>◀</button>
            <span style={{ color: 'var(--text-muted)' }}>{friendPage} / {totalFriendPages}</span>
            <button disabled={friendPage === totalFriendPages} onClick={() => setFriendPage(p => p + 1)} style={{ background: 'transparent', border: 'none', color: friendPage === totalFriendPages ? 'var(--text-muted)' : 'var(--accent-blue)', cursor: friendPage === totalFriendPages ? 'not-allowed' : 'pointer' }}>▶</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: 'var(--border-color)', padding: '8px 10px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{chatUser ? `CHAT: ${chatUser.username}` : 'CHỌN BẠN'}</span>
          {chatUser && totalMsgPages > 1 && (
             <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
               <button disabled={msgPage === totalMsgPages} onClick={() => setMsgPage(p => p + 1)} style={{ background: 'transparent', border: 'none', color: msgPage === totalMsgPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: msgPage === totalMsgPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>▲</button>
               <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>{msgPage}/{totalMsgPages}</span>
               <button disabled={msgPage === 1} onClick={() => setMsgPage(p => p - 1)} style={{ background: 'transparent', border: 'none', color: msgPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: msgPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>▼</button>
             </div>
          )}
        </div>
        
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!chatUser ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Vui lòng chọn bạn bè.</div>
          ) : currentMessages.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Hãy gửi lời chào!</div>
          ) : (
            currentMessages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start', background: msg.sender_id === user.id ? 'var(--bg-chat-mine)' : 'var(--bg-chat-their)', color: msg.sender_id === user.id ? '#0F172A' : 'var(--text-main)', padding: '6px 12px', borderRadius: '12px', maxWidth: '85%', fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                {msg.content}
              </div>
            ))
          )}
        </div>
        
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={chatUser ? "Nhập tin nhắn..." : "..."} disabled={!chatUser} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', fontSize: '0.85rem' }} />
          <button onClick={handleSendMessage} disabled={!chatUser} style={{ background: chatUser ? 'var(--accent-blue)' : 'var(--border-color)', color: chatUser ? 'white' : 'var(--text-muted)', border: 'none', padding: '0 12px', fontWeight: 'bold', cursor: chatUser ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>GỬI</button>
        </div>
      </div>

      {userToDelete && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, borderRadius: '12px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', border: '2px solid var(--accent-red)', textAlign: 'center', width: '85%' }}>
            <div style={{ color: 'var(--text-main)', marginBottom: '15px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Xóa bạn với <strong style={{color: 'var(--accent-red)'}}>{userToDelete.username}</strong>?<br/><span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>(Tin nhắn sẽ bị xóa)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={confirmRemoveFriend} style={{ background: 'var(--accent-red)', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>XÓA</button>
              <button onClick={() => setUserToDelete(null)} style={{ background: 'var(--text-muted)', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>HỦY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPanel;