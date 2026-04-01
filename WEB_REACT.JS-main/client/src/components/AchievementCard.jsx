import React from 'react';
import './AchievementCard.css'; // Chúng ta sẽ thêm chút CSS cho lung linh

const AchievementCard = ({ achievement }) => {
  // achievement sẽ bao gồm: title, description, icon_url, isUnlocked, unlockedAt
  return (
    <div className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="achievement-icon-container">
        <img 
          src={achievement.icon_url || 'https://via.placeholder.com/100'} 
          alt={achievement.title} 
          className="achievement-icon"
        />
        {!achievement.isUnlocked && <div className="lock-overlay">🔒</div>}
      </div>
      
      <div className="achievement-info">
        <h4>{achievement.title}</h4>
        <p>{achievement.description}</p>
        
        {achievement.isUnlocked ? (
          <span className="unlocked-date">
            Ngày đạt: {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')}
          </span>
        ) : (
          <span className="progress-hint">Chưa hoàn thành</span>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;