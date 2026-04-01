import { useState, useEffect } from "react";

const Ranking = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState("ALL");
  const [viewMode, setViewMode] = useState("GLOBAL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myRank, setMyRank] = useState(null);

  const filterOptions = ["ALL", "CARO HÀNG 5", "CARO HÀNG 4", "TIC-TAC-TOE"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = new URL("http://localhost:5000/api/rankings");
        url.searchParams.append("page", currentPage);
        url.searchParams.append("game", filterGame);
        url.searchParams.append("mode", viewMode);
        if (user.id) url.searchParams.append("user_id", user.id);
        const res = await fetch(url);
        const result = await res.json();
        setRankings(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setMyRank(result.myBest);
      } catch (e) {
        console.error(e);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, filterGame, viewMode, user.id]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "850px",
        margin: "0 auto",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1
          style={{
            color: "#FBBF24",
            fontSize: "2.2rem",
            fontWeight: "bold",
            margin: "0",
            textTransform: "uppercase",
          }}
        >
          Bảng Vàng Thành Tích
        </h1>
      </div>

      {user.id && myRank && (
        <div
          style={{
            background: "#1E293B",
            padding: "15px",
            border: "1px solid #FBBF24",
            display: "flex",
            justifyContent: "space-around",
            marginBottom: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              HẠNG CỦA BẠN
            </span>
            <br />
            <b style={{ fontSize: "1.6rem", color: "#FBBF24" }}>
              #{myRank.rank}
            </b>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              ĐIỂM CAO NHẤT
            </span>
            <br />
            <b style={{ fontSize: "1.6rem" }}>{myRank.score}</b>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => {
            setViewMode("GLOBAL");
            setCurrentPage(1);
          }}
          style={{
            background: viewMode === "GLOBAL" ? "#38BDF8" : "transparent",
            border: "1px solid #38BDF8",
            padding: "8px 20px",
            color: viewMode === "GLOBAL" ? "#000" : "#38BDF8",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          HỆ THỐNG
        </button>
        <button
          onClick={() => {
            setViewMode("FRIENDS");
            setCurrentPage(1);
          }}
          style={{
            background: viewMode === "FRIENDS" ? "#10B981" : "transparent",
            border: "1px solid #10B981",
            padding: "8px 20px",
            color: viewMode === "FRIENDS" ? "#fff" : "#10B981",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          BẠN BÈ
        </button>
      </div>

      <div
        style={{
          background: "#0F172A",
          border: "1px solid #334155",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "#1E293B",
            padding: "15px",
            fontWeight: "bold",
            color: "#38BDF8",
          }}
        >
          <div style={{ flex: "0 0 15%", textAlign: "center" }}>HẠNG</div>
          <div style={{ flex: "0 0 40%" }}>NGƯỜI CHƠI</div>
          <div style={{ flex: "0 0 25%", textAlign: "center" }}>ĐIỂM</div>
          <div style={{ flex: "0 0 20%", textAlign: "center" }}>TIME</div>
        </div>
        <div style={{ minHeight: "200px" }}>
          {loading ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              ĐANG TẢI...
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              Không có dữ liệu
            </div>
          ) : (
            rankings.map((r, i) => {
              const rank = (currentPage - 1) * 5 + i + 1;
              const isMe = r.player === user.username;
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    padding: "12px 15px",
                    borderBottom: "1px solid #1E293B",
                    background: isMe ? "rgba(56,189,248,0.1)" : "",
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 15%",
                      textAlign: "center",
                      color: rank <= 3 ? "#FBBF24" : "",
                    }}
                  >
                    #{rank}
                  </div>
                  <div
                    style={{
                      flex: "0 0 40%",
                      color: isMe ? "#38BDF8" : "white",
                      fontWeight: isMe ? "bold" : "normal",
                    }}
                  >
                    {r.player} {isMe && "(BẠN)"}
                  </div>
                  <div
                    style={{
                      flex: "0 0 25%",
                      textAlign: "center",
                      color: "#10B981",
                      fontWeight: "bold",
                    }}
                  >
                    {r.score}
                  </div>
                  <div
                    style={{
                      flex: "0 0 20%",
                      textAlign: "center",
                      color: "#94A3B8",
                    }}
                  >
                    {formatTime(r.time)}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            padding: "15px",
            background: "#1E293B",
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ padding: "5px 15px", cursor: "pointer" }}
          >
            Trước
          </button>
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ padding: "5px 15px", cursor: "pointer" }}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};
export default Ranking;
