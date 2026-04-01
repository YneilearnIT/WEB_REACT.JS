// File: src/pages/client/ReviewModal.jsx
import { useState } from 'react';

const ReviewModal = ({ gameName, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    // TODO: Gọi API POST /api/reviews để lưu đánh giá
    console.log('Du lieu can gui:', { gameName, rating, comment });
    alert('Logic gọi API Đánh giá chưa được viết!');
    onClose();
  };

  return (
    <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%)', background: '#1E293B', padding: '20px', border: '2px solid #38BDF8', zIndex: 1000, width: '300px', textAlign: 'center' }}>
      <h3 style={{ color: '#FB923C' }}>ĐÁNH GIÁ: {gameName}</h3>
      
      <div style={{ margin: '15px 0' }}>
        <label style={{ color: 'white', marginRight: '10px' }}>SỐ SAO (1-5):</label>
        {/* TODO: Gắn sự kiện thay đổi sao */}
        <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} style={{ width: '50px' }} />
      </div>

      <textarea 
        placeholder="Viết bình luận của bạn..." 
        value={comment} 
        onChange={(e) => setComment(e.target.value)}
        style={{ width: '100%', height: '80px', marginBottom: '15px', background: '#0F172A', color: 'white', border: '1px solid #334155', padding: '5px' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleSubmit} style={{ background: '#38BDF8', border: 'none', padding: '5px 15px', fontWeight: 'bold' }}>GỬI ĐÁNH GIÁ</button>
        <button onClick={onClose} style={{ background: '#EF4444', border: 'none', padding: '5px 15px', color: 'white', fontWeight: 'bold' }}>HỦY</button>
      </div>
    </div>
  );
};

export default ReviewModal;