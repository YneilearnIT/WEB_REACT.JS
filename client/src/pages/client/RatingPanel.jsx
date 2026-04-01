import { useState, useEffect } from 'react';

const RatingPanel = () => {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const fetchLatestRatings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/games/ratings/latest');
        const result = await res.json();
        if (res.ok) setRatings(result.data || []);
      } catch (err) { console.error(err); }
    };
    fetchLatestRatings();
    const interval = setInterval(fetchLatestRatings, 5000); // Tự cập nhật mỗi 5 giây
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '300px', height: '650px', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <h2 style={{ color: '#FBBF24', marginTop: 0, borderBottom: '1px solid #334155', paddingBottom: '10px', textAlign: 'center', fontSize: '1.2rem' }}>
        ĐÁNH GIÁ MỚI NHẤT
      </h2>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
        {ratings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>Chưa có đánh giá nào.</div>
        ) : (
          ratings.map(r => (
            <div key={r.id} style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #FBBF24' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', color: '#38BDF8', fontSize: '0.85rem' }}>{r.username}</span>
                <span style={{ color: '#FBBF24', fontSize: '0.8rem' }}>{'⭐'.repeat(r.rating)}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '5px', fontWeight: 'bold' }}>Game: {r.game_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontStyle: 'italic' }}>"{r.comment}"</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingPanel;