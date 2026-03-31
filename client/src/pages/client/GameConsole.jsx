import { useState, useEffect } from 'react';
import './GameConsole.css';

const GAME_LIST = [
  { id: 'CARO_5', name: 'CARO HÀNG 5', winCount: 5, initialSize: 10, help: 'Luân phiên đánh X và O. Người nào tạo được 1 hàng 5 quân liên tiếp sẽ thắng.' },
  { id: 'CARO_4', name: 'CARO HÀNG 4', winCount: 4, initialSize: 10, help: 'Luân phiên đánh X và O. Người nào tạo được 1 hàng 4 quân liên tiếp sẽ thắng.' },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', winCount: 3, initialSize: 3, help: 'Bàn cờ 3x3. Ai nối được 3 quân liên tiếp sẽ thắng. Kín bàn là hòa.' },
  { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', initialSize: 15, help: 'Di chuyển con trỏ và bấm Enter để tô màu. Không tính thắng thua.' },
  { id: 'SNAKE', name: 'RẮN SĂN MỒI', initialSize: 15, help: 'Sử dụng phím điều hướng để ăn mồi. (Đang cập nhật)' },
  { id: 'MATCH3', name: 'GHÉP HÀNG 3', initialSize: 8, help: 'Đổi chỗ 2 viên kẹo để tạo hàng 3. (Đang cập nhật)' },
  { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', initialSize: 4, help: 'Lật 2 thẻ bài giống nhau để ghi điểm. (Đang cập nhật)' }
];

const GameConsole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [gameState, setGameState] = useState('MENU');
  const [menuIndex, setMenuIndex] = useState(0); 
  const [activeGame, setActiveGame] = useState(null); 
  
  const [boardSize, setBoardSize] = useState(10);
  const [board, setBoard] = useState(Array(100).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [cursor, setCursor] = useState(44);
  const [winner, setWinner] = useState(null);

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);

  const [showHelp, setShowHelp] = useState(false);
  const [sysMessage, setSysMessage] = useState('');

  const clearMessageOnAction = () => {
    if (sysMessage) setSysMessage('');
  };

  // HÀM LƯU ĐIỂM THẬT VÀO BẢNG XẾP HẠNG
  const saveScoreToRanking = (finalScore) => {
    const currentRankings = JSON.parse(localStorage.getItem('rankings') || '[]');
    currentRankings.push({
      id: Date.now(),
      player: user.username || 'Người chơi',
      game: activeGame.name,
      score: finalScore,
      time: timeElapsed
    });
    localStorage.setItem('rankings', JSON.stringify(currentRankings));
  };

  const handleSaveGame = () => {
    clearMessageOnAction();
    if (gameState !== 'PLAYING' || activeGame?.id === 'DRAWING') {
      setSysMessage('Chỉ có thể Lưu khi đang trong trận đấu.');
      return;
    }
    const saveData = { activeGame, boardSize, board, isXNext, cursor, timeElapsed, score, winner };
    localStorage.setItem('saved_game_data', JSON.stringify(saveData));
    setSysMessage('Đã lưu tiến trình trận đấu.');
  };

  const handleLoadGame = () => {
    clearMessageOnAction();
    const data = localStorage.getItem('saved_game_data');
    if (!data) {
      setSysMessage('Không tìm thấy dữ liệu đã lưu.');
      return;
    }
    const parsed = JSON.parse(data);
    setActiveGame(parsed.activeGame);
    setBoardSize(parsed.boardSize);
    setBoard(parsed.board);
    setIsXNext(parsed.isXNext);
    setCursor(parsed.cursor);
    setTimeElapsed(parsed.timeElapsed);
    setScore(parsed.score);
    setWinner(parsed.winner || null);
    setGameState('PLAYING');
    setSysMessage('Đã tải lại ván đấu cũ.');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && !showHelp) {
      timer = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, winner, activeGame, showHelp]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const countInLine = (currentBoard, size, index, dRow, dCol) => {
    const player = currentBoard[index];
    const row = Math.floor(index / size);
    const col = index % size;
    let count = 0;
    for (let i = 1; i <= 5; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;
      if (r >= 0 && r < size && c >= 0 && c < size && currentBoard[r * size + c] === player) count++;
      else break;
    }
    return count;
  };

  const checkWinner = (currentBoard, size, index, winRequirement) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let [dRow, dCol] of directions) {
      if (countInLine(currentBoard, size, index, dRow, dCol) + countInLine(currentBoard, size, index, -dRow, -dCol) + 1 >= winRequirement) {
        return currentBoard[index];
      }
    }
    return null;
  };

  const findBestMove = (currentBoard, size, winRequirement) => {
    const emptyCells = currentBoard.map((cell, idx) => cell === null ? idx : null).filter(val => val !== null);
    let bestBlockMove = null, maxBlockCount = 0;
    let bestWinMove = null, maxWinCount = 0;

    for (const moveIndex of emptyCells) {
      currentBoard[moveIndex] = 'O'; 
      if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'O') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = 'X'; 
      if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'X') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = null; 

      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        currentBoard[moveIndex] = 'X'; 
        const playerLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (playerLine > maxBlockCount) { maxBlockCount = playerLine; bestBlockMove = moveIndex; }
        currentBoard[moveIndex] = 'O'; 
        const botLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (botLine > maxWinCount) { maxWinCount = botLine; bestWinMove = moveIndex; }
        currentBoard[moveIndex] = null; 
      }
    }
    if (maxBlockCount >= winRequirement - 2) return bestBlockMove; 
    if (maxWinCount >= winRequirement - 2) return bestWinMove;
    if (maxBlockCount >= Math.max(1, winRequirement - 3)) return bestBlockMove;
    if (emptyCells.length === 0) return null; 
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const startGame = () => {
    const game = GAME_LIST[menuIndex];
    setActiveGame(game);
    setBoardSize(game.initialSize);
    setBoard(Array(game.initialSize * game.initialSize).fill(null));
    setCursor(Math.floor((game.initialSize * game.initialSize) / 2));
    setIsXNext(true);
    setWinner(null);
    setTimeElapsed(0);
    setScore(0);
    setSysMessage('');
    setGameState('PLAYING');

    if (['SNAKE', 'MATCH3', 'MEMORY'].includes(game.id)) {
      setWinner('COMING_SOON');
    }
  };

  const backToMenu = () => {
    clearMessageOnAction();
    setGameState('MENU');
    setActiveGame(null);
  };

  const moveCursor = (direction) => {
    if (showHelp) return; 
    clearMessageOnAction();

    if (gameState === 'MENU') {
      if (direction === 'LEFT') setMenuIndex(prev => (prev === 0 ? GAME_LIST.length - 1 : prev - 1));
      if (direction === 'RIGHT') setMenuIndex(prev => (prev === GAME_LIST.length - 1 ? 0 : prev + 1));
      return;
    }
    if (winner || !isXNext) return; 
    setCursor((prev) => {
      if (direction === 'UP' && prev >= boardSize) return prev - boardSize;
      if (direction === 'DOWN' && prev < (boardSize * boardSize) - boardSize) return prev + boardSize;
      if (direction === 'LEFT' && prev % boardSize !== 0) return prev - 1;
      if (direction === 'RIGHT' && (prev + 1) % boardSize !== 0) return prev + 1;
      return prev;
    });
  };

  const handleEnter = () => {
    if (showHelp) return; 
    clearMessageOnAction();

    if (gameState === 'MENU') { startGame(); return; }
    if (winner) { startGame(); return; }
    if (!isXNext) return; 
    
    if (activeGame.id === 'DRAWING') {
      const newBoard = [...board];
      newBoard[cursor] = newBoard[cursor] === null ? 'X' : newBoard[cursor] === 'X' ? 'O' : null;
      setBoard(newBoard);
      return;
    }

    if (board[cursor] !== null) return;
    
    const newBoard = [...board];
    newBoard[cursor] = 'X';
    setBoard(newBoard);
    
    // NGƯỜI CHƠI ĐÁNH
    const playerWin = checkWinner(newBoard, boardSize, cursor, activeGame.winCount);
    if (playerWin) { 
      setWinner('X'); setScore(100); 
      setSysMessage('BẠN THẮNG - BẤM ENTER ĐỂ CHƠI VÁN MỚI'); 
      saveScoreToRanking(100);
      return; 
    }
    if (!newBoard.includes(null)) { 
      setWinner('DRAW'); setScore(10); 
      setSysMessage('HÒA CỜ - BẤM ENTER ĐỂ CHƠI VÁN MỚI'); 
      saveScoreToRanking(10);
      return; 
    }

    setIsXNext(false); 

    // MÁY ĐÁNH
    setTimeout(() => {
      const smartMove = findBestMove(newBoard, boardSize, activeGame.winCount);
      if (smartMove === null) { 
        setWinner('DRAW'); setScore(10); 
        setSysMessage('HÒA CỜ - BẤM ENTER ĐỂ CHƠI VÁN MỚI'); 
        saveScoreToRanking(10);
        return; 
      }
      const botBoard = [...newBoard];
      botBoard[smartMove] = 'O';
      setBoard(botBoard);
      
      const botWin = checkWinner(botBoard, boardSize, smartMove, activeGame.winCount);
      if (botWin) { 
        setWinner('O'); setScore(0); 
        setSysMessage('MÁY THẮNG - BẤM ENTER ĐỂ PHỤC THÙ'); 
        saveScoreToRanking(0);
      } 
      else if (!botBoard.includes(null)) { 
        setWinner('DRAW'); setScore(10); 
        setSysMessage('HÒA CỜ - BẤM ENTER ĐỂ CHƠI VÁN MỚI'); 
        saveScoreToRanking(10);
      } 
      else { 
        setIsXNext(true); 
      }
    }, 400); 
  };

  return (
    <div className="modern-console-system">
      <div className="display-wrapper">
        
        <div className="game-info-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span className="player-name">{user.username || 'Người chơi'}</span>
            {gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && (
              <span className="turn-text" style={{ marginLeft: '10px' }}>
                <span className={`turn-marker ${isXNext ? 'x' : 'o'}`}></span>
                <strong>{isXNext ? 'Lượt của bạn' : 'Máy đang nghĩ'}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {gameState === 'PLAYING' && (
               <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 'bold' }}>
                  <span style={{ marginRight: '10px' }}>THỜI GIAN: <span style={{ color: 'white' }}>{formatTime(timeElapsed)}</span></span>
                  <span>ĐIỂM: <span style={{ color: '#FBBF24' }}>{score}</span></span>
               </div>
            )}
            
            <div className="sys-btn-group">
               <button className="sys-btn" onClick={handleSaveGame}>LƯU</button>
               <button className="sys-btn" onClick={handleLoadGame}>TẢI</button>
            </div>
          </div>
        </div>

        <div style={{ minHeight: '20px', textAlign: 'center', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#FB923C', letterSpacing: '1px' }}>
          {sysMessage ? sysMessage : winner === 'COMING_SOON' ? 'TÍNH NĂNG ĐANG CẬP NHẬT' : ''}
        </div>
        
        {gameState === 'MENU' ? (
          <div className="menu-title">
            <span style={{ fontSize: '1rem', letterSpacing: '2px' }}>CHỌN TRÒ CHƠI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94A3B8' }}>&lt;&lt;</span>
              <strong>{GAME_LIST[menuIndex].name}</strong>
              <span style={{ color: '#94A3B8' }}>&gt;&gt;</span>
            </div>
          </div>
        ) : (
          <div 
            className="modern-board" 
            style={{
              display: 'grid', gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              gridTemplateRows: `repeat(${boardSize}, 1fr)`, width: '300px', height: '300px', gap: '1px'
            }}
          >
            {board.map((cell, index) => (
              <div key={index} className={`modern-cell ${gameState === 'PLAYING' && index === cursor ? 'cursor' : ''}`}>
                {cell && (
                  <span className={`cell-content ${cell === 'X' ? 'x' : 'o'}`} style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>
                    {activeGame?.id === 'DRAWING' ? '█' : cell}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {showHelp && (
           <div style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', border: '1px solid #38BDF8', padding: '15px', width: '220px', zIndex: 100, textAlign: 'center' }}>
             <div style={{ color: '#FB923C', fontWeight: 'bold', marginBottom: '10px' }}>
                {gameState === 'MENU' ? GAME_LIST[menuIndex].name : activeGame.name}
             </div>
             <div style={{ color: '#E2E8F0', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'left' }}>
                {gameState === 'MENU' ? GAME_LIST[menuIndex].help : activeGame.help}
             </div>
             <button onClick={() => setShowHelp(false)} style={{ background: '#38BDF8', color: '#0F172A', border: 'none', padding: '5px 15px', fontWeight: 'bold', cursor: 'pointer' }}>ĐÓNG</button>
           </div>
        )}

      </div>

      <div className="modern-controller">
        {gameState === 'MENU' ? (
          <div className="nav-menu-panel">
            <div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button><span className="btn-label">Trái</span></div>
            <div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button><span className="btn-label">Phải</span></div>
          </div>
        ) : (
          <div className="d-pad-panel">
            <div className="btn-wrapper" style={{gridColumn: 2, gridRow: 1}}><button className="flat-btn" onClick={() => moveCursor('UP')}>↑</button><span className="btn-label">Lên</span></div>
            <div className="btn-wrapper" style={{gridColumn: 1, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button><span className="btn-label">Trái</span></div>
            <div className="btn-wrapper" style={{gridColumn: 2, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('DOWN')}>↓</button><span className="btn-label">Xuống</span></div>
            <div className="btn-wrapper" style={{gridColumn: 3, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button><span className="btn-label">Phải</span></div>
          </div>
        )}

        <div className="flat-btn-group">
          <div className="btn-wrapper">
            <button className="flat-action-btn yellow" onClick={backToMenu}>⮌</button>
            <span className="btn-label">Quay lại</span>
          </div>
          <div className="btn-wrapper">
            <button className="flat-action-btn red" onClick={handleEnter}>↵</button>
            <span className="btn-label">Chọn</span>
          </div>
          <div className="btn-wrapper">
            <button className="flat-action-btn blue" onClick={() => setShowHelp(true)}>?</button>
            <span className="btn-label">Trợ giúp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameConsole;