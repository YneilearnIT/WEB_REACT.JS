import { useState, useEffect } from 'react';

const ITEMS_PER_PAGE = 10;

const Ranking = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // State quản lý bộ lọc và phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [filterGame, setFilterGame] = useState('ALL');
  const [filterScope, setFilterScope] = useState('ALL'); // ALL (Hệ thống), FRIENDS (Bạn bè), PERSONAL (Cá nhân)
  
  const [realData, setRealData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gọi API kéo dữ liệu mỗi khi bộ lọc thay đổi
  useEffect(() => {
    if (!user.id) return;

    const fetchRanking = async () => {
      setLoading(true);
      try {
        const url = `http://localhost:5000/api/ranking?user_id=${user.id}&scope=${filterScope}&game=${filterGame}`;
        const res = await fetch(url);
        const result = await res.json();
        
        if (res.ok) {
          setRealData(result.data || []);
          setCurrentPage(1); // Reset về trang 1 mỗi lần lọc
        }
      } catch (error) {
        console.error("Lỗi kéo ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [filterGame, filterScope, user.id]);

  // Xử lý Phân trang (Pagination) ở phía Client
  const totalPages = Math.ceil(realData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = realData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#FB923C', letterSpacing: '2px', margin: 0 }}>BẢNG XẾP HẠNG</h2>
        
        {/* BỘ LỌC ĐÁP ỨNG ĐÚNG RUBRIC */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <select 
            value={filterScope} 
            onChange={(e) => setFilterScope(e.target.value)}
            style={{ padding: '8px', background: 'var(--nav-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 'bold' }}
          >
            <option value="ALL">TOÀN HỆ THỐNG</option>
            <option value="FRIENDS">CHỈ BẠN BÈ</option>
            <option value="PERSONAL">CHỈ CÁ NHÂN</option>
          </select>

          <select 
            value={filterGame} 
            onChange={(e) => setFilterGame(e.target.value)}
            style={{ padding: '8px', background: 'var(--nav-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 'bold' }}
          >
            <option value="ALL">TẤT CẢ TRÒ CHƠI</option>
            <option value="CARO HÀNG 5">CARO HÀNG 5</option>
            <option value="CARO HÀNG 4">CARO HÀNG 4</option>
            <option value="TIC-TAC-TOE">TIC-TAC-TOE</option>
            <option value="RẮN SĂN MỒI">RẮN SĂN MỒI</option>
            <option value="GHÉP HÀNG 3">GHÉP HÀNG 3</option>
            <option value="CỜ TRÍ NHỚ">CỜ TRÍ NHỚ</option>
          </select>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--nav-bg)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: 'var(--border-color)', color: 'var(--text-color)', textAlign: 'left' }}>
            <th style={{ padding: '12px 15px' }}>HẠNG</th>
            <th style={{ padding: '12px 15px' }}>NGƯỜI CHƠI</th>
            <th style={{ padding: '12px 15px' }}>TRÒ CHƠI</th>
            <th style={{ padding: '12px 15px', textAlign: 'right' }}>ĐIỂM SỐ</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
             <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#38BDF8', fontWeight: 'bold' }}>Đang tải dữ liệu...</td></tr>
          ) : currentData.length > 0 ? (
            currentData.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#38BDF8' }}>#{startIndex + index + 1}</td>
                <td style={{ padding: '12px 15px' }}>
                   {item.player} {item.player === user.username && <span style={{fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px'}}>Bạn</span>}
                </td>
                <td style={{ padding: '12px 15px', color: '#94A3B8' }}>{item.game}</td>
                <td style={{ padding: '12px 15px', textAlign: 'right', color: '#FBBF24', fontWeight: 'bold' }}>{item.score}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
                Không tìm thấy dữ liệu xếp hạng phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TÍNH NĂNG PHÂN TRANG (PAGINATION) */}
      {currentData.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>TRANG {currentPage} / {totalPages || 1}</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '8px 15px', background: currentPage === 1 ? 'transparent' : '#38BDF8', color: currentPage === 1 ? '#94A3B8' : '#0F172A', border: `1px solid ${currentPage === 1 ? '#334155' : '#38BDF8'}`, borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              TRƯỚC
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '8px 15px', background: currentPage === totalPages || totalPages === 0 ? 'transparent' : '#38BDF8', color: currentPage === totalPages || totalPages === 0 ? '#94A3B8' : '#0F172A', border: `1px solid ${currentPage === totalPages || totalPages === 0 ? '#334155' : '#38BDF8'}`, borderRadius: '4px', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              SAU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ranking;