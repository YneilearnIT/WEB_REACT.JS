import { useState, useEffect } from "react";
import "./GameConsole.css";

const GAME_LIST = [
  {
    id: "CARO_5",
    name: "CARO HÀNG 5",
    initialSize: 10,
    guide: {
      intro: "Cờ caro đối kháng truyền thống.",
      goal: "Tạo hàng 5 quân liên tiếp.",
      gameplay: "Hai người chơi luân phiên đặt dấu.",
      control: "Dùng phím điều hướng để di chuyển cursor và nhấn CHỌN.",
      rule: "Không ghi đè ô đã có quân.",
      score: "+50 điểm khi thắng."
    }
  },
  {
    id: "SNAKE",
    name: "RẮN SĂN MỒI",
    initialSize: 15,
    guide: {
      intro: "Snake điều khiển rắn ăn mồi.",
      goal: "Ăn càng nhiều càng tốt, không đụng tường.",
      gameplay: "Rắn di chuyển liên tục, ăn mồi sẽ dài ra.",
      control: "Sử dụng các phím mũi tên để chuyển hướng.",
      rule: "Thua nếu đụng tường hoặc đụng thân mình.",
      score: "+10 điểm mỗi viên mồi."
    }
  }
];

export default function GameConsole() {
  const [gameState, setGameState] = useState("MENU");
  const [activeGame, setActiveGame] = useState(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  
  // Cursor cho Caro/Menu
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  // State cho Snake
  const [snake, setSnake] = useState([[2, 2], [2, 1], [2, 0]]);
  const [dir, setDir] = useState([0, 1]);
  const [food, setFood] = useState([5, 5]);

  // --- LOGIC RẮN TỰ CHẠY ---
  useEffect(() => {
    if (gameState !== 'PLAYING' || activeGame?.id !== 'SNAKE') return;

    const moveSnake = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = [head[0] + dir[0], head[1] + dir[1]];
        const size = activeGame.initialSize;

        if (newHead[0] < 0 || newHead[0] >= size || newHead[1] < 0 || newHead[1] >= size ||
            prev.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
          setGameState('GAME_OVER');
          return prev;
        }

        const newSnake = [newHead, ...prev];
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore(s => s + 10);
          setFood([Math.floor(Math.random() * size), Math.floor(Math.random() * size)]);
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(moveSnake);
  }, [gameState, activeGame, dir, food]);

  // --- HÀM ĐIỀU KHIỂN (KHỚP VỚI CONTROLLER CSS) ---
  const handleAction = (action) => {
    if (gameState === "MENU") {
      if (action === "LEFT") setMenuIndex(prev => (prev > 0 ? prev - 1 : GAME_LIST.length - 1));
      if (action === "RIGHT") setMenuIndex(prev => (prev < GAME_LIST.length - 1 ? prev + 1 : 0));
      if (action === "START") startGame();
    } else if (gameState === "PLAYING" && activeGame?.id === "SNAKE") {
      if (action === "UP" && dir[0] !== 1) setDir([-1, 0]);
      if (action === "DOWN" && dir[0] !== -1) setDir([1, 0]);
      if (action === "LEFT" && dir[1] !== 1) setDir([0, -1]);
      if (action === "RIGHT" && dir[1] !== -1) setDir([0, 1]);
    }
  };

  const startGame = () => {
    setActiveGame(GAME_LIST[menuIndex]);
    setGameState("PLAYING");
    setScore(0);
    if (GAME_LIST[menuIndex].id === 'SNAKE') {
      setSnake([[2, 2], [2, 1], [2, 0]]);
      setDir([0, 1]);
    }
  };

  return (
    <div className="modern-console-system">
      {/* MÀN HÌNH HIỂN THỊ */}
      <div className="display-wrapper">
        <div className="game-info-panel">
          <span className="player-name">PLAYER_01</span>
          <span className="turn-text">SCORE: {score}</span>
        </div>

        {gameState === "MENU" ? (
          <div className="menu-title">
            GAME: <strong>{GAME_LIST[menuIndex].name}</strong>
            <p style={{fontSize: '0.8rem'}}>NHẤN [CHỌN] ĐỂ CHƠI</p>
          </div>
        ) : (
          <div className="modern-board" style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${activeGame.initialSize}, 1fr)`,
            width: '280px', height: '280px' 
          }}>
            {Array.from({ length: activeGame.initialSize * activeGame.initialSize }).map((_, i) => {
              const y = Math.floor(i / activeGame.initialSize);
              const x = i % activeGame.initialSize;
              const isSnake = snake.some(s => s[0] === y && s[1] === x);
              const isFood = food[0] === y && food[1] === x;

              return (
                <div key={i} className="modern-cell">
                  {isSnake && <div style={{width:'90%', height:'90%', background:'#38BDF8', borderRadius:'2px'}} />}
                  {isFood && <div style={{width:'60%', height:'60%', background:'#EF4444', borderRadius:'50%'}} />}
                </div>
              );
            })}
          </div>
        )}

        {/* MÀN HÌNH THUA / THẮNG */}
        {gameState === "GAME_OVER" && (
          <div className="victory-overlay">
            <div className="victory-text o">GAME OVER</div>
            <button className="help-modal-close" onClick={() => setGameState("MENU")}>QUAY LẠI</button>
          </div>
        )}

        {/* MODAL HƯỚNG DẪN */}
        {showHelp && (
          <div className="help-modal-overlay">
            <div className="help-modal-box">
              <div className="help-modal-title">HƯỚNG DẪN</div>
              <div className="help-modal-content">
                {GAME_LIST[menuIndex].guide.intro}<br/>
                <b>Mục tiêu:</b> {GAME_LIST[menuIndex].guide.goal}
              </div>
              <button className="help-modal-close" onClick={() => setShowHelp(false)}>ĐÓNG</button>
            </div>
          </div>
        )}
      </div>

      {/* BỘ ĐIỀU KHIỂN (CONTROLLER) */}
      <div className="modern-controller">
        <div className="d-pad-panel">
          <div /> <button className="flat-btn" onClick={() => handleAction("UP")}>▲</button> <div />
          <button className="flat-btn" onClick={() => handleAction("LEFT")}>◀</button>
          <button className="flat-btn" onClick={() => handleAction("DOWN")}>▼</button>
          <button className="flat-btn" onClick={() => handleAction("RIGHT")}>▶</button>
        </div>

        <div className="flat-btn-group">
          <div className="btn-wrapper">
            <button className="flat-action-btn yellow" onClick={() => handleAction("BACK")}>◀</button>
            <span className="btn-label">QUAY LẠI</span>
          </div>
          <div className="btn-wrapper">
            <button className="flat-action-btn red" onClick={() => handleAction("START")}>OK</button>
            <span className="btn-label">CHỌN</span>
          </div>
          <div className="btn-wrapper">
            <button className="flat-action-btn blue" onClick={() => setShowHelp(true)}>?</button>
            <span className="btn-label">HỖ TRỢ</span>
          </div>
        </div>
      </div>
    </div>
  );
}