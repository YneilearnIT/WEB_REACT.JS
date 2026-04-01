import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminAchievementManager = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/achievements/all');
        setList(res.data);
      } catch (err) {
        console.error("Lỗi tải danh sách quản trị:", err);
      }
    };
    fetchAll();
  }, []);

  return (
    <div style={{ width: '100%', padding: '20px', color: 'var(--text-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#EF4444', margin: 0 }}>QUẢN LÝ DANH MỤC THÀNH TỰU</h2>
        <button style={{ 
          padding: '10px 20px', 
          background: '#10B981', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          + THÊM THÀNH TỰU MỚI
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: '#1E293B', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
          <thead>
            <tr style={{ background: '#334155' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Icon</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Tên thành tựu</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Loại điều kiện</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Giá trị mốc</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #475569' }}>
                <td style={{ padding: '10px' }}>
                  <img src={item.icon_url || 'https://via.placeholder.com/40'} alt="" width="40" />
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.description}</div>
                </td>
                <td style={{ padding: '10px' }}>{item.condition_type}</td>
                <td style={{ padding: '10px' }}>{item.condition_value}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button style={{ color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Sửa</button>
                  <button style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAchievementManager;