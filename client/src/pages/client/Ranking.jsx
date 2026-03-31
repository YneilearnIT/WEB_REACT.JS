import { useState } from 'react';

// Dữ liệu giả lập để test phân trang
const FAKE_DATA = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  player: `PLAYER_${i + 1}`,
  game: i % 2 === 0 ? 'CARO 5' : 'TIC-TAC-TOE',
  score: 1000 - (i * 15)
}));

const ITEMS_PER_PAGE = 10;

const Ranking = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterGame, setFilterGame] = useState('ALL');

  // Xử lý lọc theo game
  const filteredData = filterGame === 'ALL' ? FAKE_DATA : FAKE_DATA.filter(item => item.game === filterGame);
  
  // Xử lý phân trang
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', width: '100%', color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#FB923C', letterSpacing: '2px', margin: 0 }}>BANG XEP HANG</h2>
        
        <select 
          value={filterGame} 
          onChange={(e) => { setFilterGame(e.target.value); setCurrentPage(1); }}
          style={{ padding: '8px', background: 'var(--nav-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
        >
          <option value="ALL">TAT CA GAME</option>
          <option value="CARO 5">CARO 5</option>
          <option value="TIC-TAC-TOE">TIC-TAC-TOE</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--nav-bg)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: 'var(--border-color)', color: 'var(--text-color)', textAlign: 'left' }}>
            <th style={{ padding: '12px 15px' }}>HANG</th>
            <th style={{ padding: '12px 15px' }}>NGUOI CHOI</th>
            <th style={{ padding: '12px 15px' }}>GAME</th>
            <th style={{ padding: '12px 15px', textAlign: 'right' }}>DIEM SO</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#38BDF8' }}>#{startIndex + index + 1}</td>
              <td style={{ padding: '12px 15px' }}>{item.player}</td>
              <td style={{ padding: '12px 15px', color: '#94A3B8' }}>{item.game}</td>
              <td style={{ padding: '12px 15px', textAlign: 'right', color: '#FBBF24', fontWeight: 'bold' }}>{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* COMPONENT PHÂN TRANG */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>TRANG {currentPage} / {totalPages || 1}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '8px 15px', background: currentPage === 1 ? 'transparent' : '#38BDF8', color: currentPage === 1 ? '#94A3B8' : '#0F172A', border: `1px solid ${currentPage === 1 ? '#334155' : '#38BDF8'}`, borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            TRUOC
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
    </div>
  );
};

export default Ranking;