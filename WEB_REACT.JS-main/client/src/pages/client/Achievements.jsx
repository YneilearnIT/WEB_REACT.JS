import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AchievementCard from '../../components/AchievementCard';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        // Thử gọi API lấy danh sách thành tựu
        const res = await axios.get('http://localhost:5000/api/achievements');
        setAchievements(res.data);
      } catch (err) {
        console.error("Lỗi kết nối Backend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Đang tải...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#ff9800', marginBottom: '30px' }}>KHO THÀNH TỰU</h1>
      
      {achievements.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa' }}>
          <p>Không có dữ liệu nào.</p>
          <p style={{ fontSize: '0.8rem' }}>Vui lòng kiểm tra Backend (Port 5000) và chạy lệnh Seed dữ liệu.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {achievements.map(item => (
            <AchievementCard key={item.id} achievement={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;