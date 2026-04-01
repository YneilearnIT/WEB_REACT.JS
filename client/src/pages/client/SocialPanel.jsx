import { useState, useEffect, useRef } from "react";
import "./GameConsole.css";

const SocialPanel = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]); // STATE MỚI: Chứa lời mời kết bạn
  const [searchUsername, setSearchUsername] = useState("");
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sysMsg, setSysMsg] = useState("");

  const [userToDelete, setUserToDelete] = useState(null);
  const pressTimer = useRef(null);
  const chatContainerRef = useRef(null);

  // Tự động tải Bạn bè và Lời mời kết bạn mỗi 3 giây
  useEffect(() => {
    if (!user.id) return;
    const fetchSocialData = async () => {
      try {
        const [fRes, rRes] = await Promise.all([
          fetch(`http://localhost:5000/api/friends/${user.id}`),
          fetch(`http://localhost:5000/api/friends/requests/${user.id}`),
        ]);
        if (fRes.ok) setFriends(await fRes.json());
        if (rRes.ok) setRequests(await rRes.json());
      } catch (err) {}
    };

    fetchSocialData();
    const interval = setInterval(fetchSocialData, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Tự động tải tin nhắn
  useEffect(() => {
    if (!user.id || !chatUser) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/messages/${user.id}/${chatUser.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }
      } catch (err) {}
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chatUser, user.id]);

  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return;
    setSysMsg("ĐANG TÌM...");
    try {
      const res = await fetch("http://localhost:5000/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          friend_username: searchUsername,
        }),
      });
      const data = await res.json();
      setSysMsg(data.message);
      if (res.ok) setSearchUsername("");
      setTimeout(() => setSysMsg(""), 3000);
    } catch (err) {
      setSysMsg("LỖI KẾT NỐI");
    }
  };

  // --- LOGIC CHẤP NHẬN / TỪ CHỐI LỜI MỜI ---
  const acceptRequest = async (requestId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      // Giao diện sẽ tự động cập nhật lại ở lần quét 3 giây tiếp theo
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err) {}
  };

  const rejectRequest = async (senderId) => {
    try {
      await fetch(`http://localhost:5000/api/friends/${user.id}/${senderId}`, {
        method: "DELETE",
      });
      setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
    } catch (err) {}
  };

  // --- LOGIC XÓA BẠN (NHẤN GIỮ) ---
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
    setFriends((prev) => prev.filter((f) => f.id !== targetId));
    if (chatUser && chatUser.id === targetId) {
      setChatUser(null);
      setMessages([]);
    }

    try {
      await fetch(`http://localhost:5000/api/friends/${user.id}/${targetId}`, {
        method: "DELETE",
      });
    } catch (err) {}
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatUser) return;
    const tempMsg = chatInput;
    setChatInput("");
    try {
      await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: chatUser.id,
          content: tempMsg,
        }),
      });
    } catch (err) {}
  };

  if (!user.id) return null;

  return (
    <div
      className="modern-console-system"
      style={{
        position: "relative",
        width: "380px",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          color: "#38BDF8",
          marginTop: 0,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "10px",
          fontSize: "1.2rem",
        }}
      >
        KẾT BẠN & TRÒ CHUYỆN
      </h3>

      {/* TÌM VÀ KẾT BẠN */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        <input
          placeholder="Nhập tên tài khoản..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            background: "rgba(15,23,42,0.6)",
            border: "1px solid #38BDF8",
            color: "white",
            fontSize: "0.95rem",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleAddFriend}
          style={{
            background: "#38BDF8",
            border: "none",
            color: "#0F172A",
            fontWeight: "bold",
            padding: "0 15px",
            cursor: "pointer",
            fontSize: "0.95rem",
            borderRadius: "4px",
          }}
        >
          THÊM
        </button>
      </div>
      {sysMsg && (
        <div
          style={{
            fontSize: "0.85rem",
            color: "#FBBF24",
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          {sysMsg}
        </div>
      )}

      {/* HIỂN THỊ LỜI MỜI KẾT BẠN (Chỉ hiện khi có người mời) */}
      {requests.length > 0 && (
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              color: "#10B981",
              fontSize: "0.95rem",
              marginBottom: "10px",
            }}
          >
            LỜI MỜI CHỜ DUYỆT ({requests.length})
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          >
            {requests.map((req) => (
              <div
                key={req.request_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(30,41,59,0.8)",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    color: "white",
                  }}
                >
                  {req.username}
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={() => acceptRequest(req.request_id)}
                    style={{
                      background: "#10B981",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => rejectRequest(req.sender_id)}
                    style={{
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH BẠN BÈ */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "10px",
          marginBottom: "15px",
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              color: "#94A3B8",
              fontSize: "0.95rem",
            }}
          >
            DANH SÁCH BẠN BÈ ({friends.length})
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#EF4444",
              fontStyle: "italic",
            }}
          >
            *Nhấn giữ tên để xóa
          </div>
        </div>

        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {friends.length === 0 ? (
            <div
              style={{
                fontSize: "0.9rem",
                color: "#64748B",
                fontStyle: "italic",
              }}
            >
              Chưa có bạn bè.
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                onClick={() => setChatUser(f)}
                onMouseDown={() => handlePressStart(f)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(f)}
                onTouchEnd={handlePressEnd}
                style={{
                  padding: "10px",
                  background:
                    chatUser?.id === f.id ? "#38BDF8" : "rgba(30,41,59,0.6)",
                  color: chatUser?.id === f.id ? "#0F172A" : "white",
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  transition: "0.2s",
                  userSelect: "none",
                }}
              >
                {f.username}
              </div>
            ))
          )}
        </div>
      </div>

      {/* KHUNG CHAT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: "rgba(15,23,42,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "rgba(51,65,85,0.6)",
            padding: "10px",
            fontWeight: "bold",
            textAlign: "center",
            fontSize: "0.95rem",
            color: "#FBBF24",
          }}
        >
          {chatUser
            ? `ĐANG CHAT VỚI: ${chatUser.username}`
            : "CHƯA CHỌN BẠN BÈ"}
        </div>

        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {!chatUser ? (
            <div
              style={{
                fontSize: "0.9rem",
                color: "#64748B",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              Chọn một người bạn ở trên để bắt đầu nhắn tin.
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                fontSize: "0.9rem",
                color: "#64748B",
                textAlign: "center",
                marginTop: "30px",
              }}
            >
              Chưa có tin nhắn nào.
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    background: isMine ? "#38BDF8" : "rgba(51,65,85,0.8)",
                    color: isMine ? "#0F172A" : "white",
                    padding: "8px 14px",
                    borderRadius: "15px",
                    maxWidth: "85%",
                    fontSize: "0.95rem",
                    wordBreak: "break-word",
                    lineHeight: "1.4",
                  }}
                >
                  {msg.content}
                </div>
              );
            })
          )}
        </div>

        {chatUser && (
          <div
            style={{
              display: "flex",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Nhập tin nhắn..."
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                color: "white",
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                background: "#38BDF8",
                border: "none",
                padding: "0 20px",
                fontWeight: "bold",
                color: "#0F172A",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              GỬI
            </button>
          </div>
        )}
      </div>

      {/* POPUP XÁC NHẬN XÓA */}
      {userToDelete && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15,23,42,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              background: "#1E293B",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #EF4444",
              textAlign: "center",
              width: "80%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                color: "white",
                marginBottom: "20px",
                fontSize: "1.1rem",
              }}
            >
              Hủy kết bạn với{" "}
              <strong style={{ color: "#EF4444" }}>
                {userToDelete.username}
              </strong>
              ?
            </div>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "15px" }}
            >
              <button
                onClick={confirmRemoveFriend}
                style={{
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                XÁC NHẬN
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                style={{
                  background: "#64748B",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                HỦY BỎ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPanel;
