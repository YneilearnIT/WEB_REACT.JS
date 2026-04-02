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
    const interval = setInterval(fetchLatestRatings, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '340px', height: '680px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', color: 'var(--text-main)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', transition: '0.3s' }}>
      <h2 style={{ color: 'var(--accent-yellow)', marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', textAlign: 'center', fontSize: '1.2rem' }}>
        ĐÁNH GIÁ MỚI NHẤT
      </h2>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {ratings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Chưa có đánh giá nào.</div>
        ) : (
          ratings.map(r => (
            <div key={r.id} style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--accent-yellow)', transition: '0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '0.85rem' }}>{r.username}</span>
                <span style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem' }}>{'⭐'.repeat(r.rating)}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 'bold' }}>Game: {r.game_name}</div>
              {r.comment && <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{r.comment}"</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingPanel;