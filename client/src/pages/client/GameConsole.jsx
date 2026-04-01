import { useState, useEffect } from 'react';
import './GameConsole.css';

// TODO: KHI DEMO TRÊN MÁY KHÁC, ĐỔI 'localhost' THÀNH ĐỊA CHỈ IP CỦA MÁY CHỦ
const API_BASE_URL = 'http://localhost:5000';

const GAME_LIST_BASE = [
  { id: 'CARO_5', name: 'CARO HÀNG 5', winCount: 5, initialSize: 10, help: 'Luân phiên đánh X và O. Hàng 5 liên tiếp sẽ thắng.' },
  { id: 'CARO_4', name: 'CARO HÀNG 4', winCount: 4, initialSize: 10, help: 'Luân phiên đánh X và O. Hàng 4 liên tiếp sẽ thắng.' },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', winCount: 3, initialSize: 3, help: 'Bàn cờ 3x3. Nối 3 liên tiếp sẽ thắng.' },
  { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', initialSize: 15, help: 'Di chuyển con trỏ và bấm Enter để tô màu. Không tính thắng thua.' },
  { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', initialSize: 4, help: 'Di chuyển và bấm Enter lật 2 thẻ bài giống nhau để ghi điểm.' },
  { id: 'SNAKE', name: 'RẮN SĂN MỒI', initialSize: 15, help: 'Sử dụng 4 nút điều hướng để di chuyển. Ăn táo để tăng điểm.' },
  { id: 'MATCH3', name: 'GHÉP HÀNG 3', initialSize: 8, help: 'Chọn 1 viên kẹo, di chuyển sang kẹo kế bên và Chọn để đổi chỗ.' }
];

const CANDIES = ['🔴', '🟡', '🟢', '🔵', '🟣'];

const GameConsole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  const [gameState, setGameState] = useState('MENU');
  const [menuIndex, setMenuIndex] = useState(0); 
  const [activeGame, setActiveGame] = useState(null); 
  const [dynamicGameList, setDynamicGameList] = useState(GAME_LIST_BASE);

  const [boardSize, setBoardSize] = useState(10);
  const [board, setBoard] = useState(Array(100).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [cursor, setCursor] = useState(44);
  const [winner, setWinner] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [sysMessage, setSysMessage] = useState('');

  const [memoryDeck, setMemoryDeck] = useState([]); 
  const [flippedCards, setFlippedCards] = useState([]); 
  const [matchedCards, setMatchedCards] = useState([]);
  const [snakeState, setSnakeState] = useState({ body: [], food: null, dir: 'UP', isRunning: false, speed: 200 });
  const [selectedCandy, setSelectedCandy] = useState(null);
  const [match3Trigger, setMatch3Trigger] = useState(0); 

  const clearMessageOnAction = () => { if (sysMessage) setSysMessage(''); };

  // --- HỆ THỐNG RADAR API: ĐỒNG BỘ THỜI GIAN THỰC XUYÊN MẠNG LAN ---
  useEffect(() => {
    const fetchAdminConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/games/config`);
        if (res.ok) {
          const adminConfig = await res.json();
          const syncedList = GAME_LIST_BASE.map(baseGame => {
            const conf = adminConfig.find(c => c.id === baseGame.id);
            return {
              ...baseGame,
              enabled: conf !== undefined ? conf.enabled : true,
              currentSize: conf !== undefined ? conf.size : baseGame.initialSize
            };
          });
          setDynamicGameList(prev => JSON.stringify(prev) !== JSON.stringify(syncedList) ? syncedList : prev);
        }
      } catch (err) { console.log('Radar mất tín hiệu kết nối API'); }
    };

    let intervalId;
    if (gameState === 'MENU') {
      fetchAdminConfig(); // Quét lần 1 ngay lập tức
      intervalId = setInterval(fetchAdminConfig, 1000); // Radar quét máy chủ mỗi 1 giây
    }
    return () => clearInterval(intervalId);
  }, [gameState]);

  const saveScoreToRanking = async (finalScore) => {
    try {
      if (!user || !user.id || !token) return; 
      await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ game_name: activeGame.name, score: finalScore, time_elapsed: timeElapsed })
      });
    } catch (err) {}
  };

  const handleSaveGame = async () => {
    clearMessageOnAction();
    if (gameState !== 'PLAYING' || activeGame?.id === 'DRAWING') { setSysMessage('Chỉ có thể Lưu khi đang trong trận đấu.'); return; }
    setSysMessage('Đang lưu lên Cloud...');
    const saveData = { activeGame, boardSize, board, isXNext, cursor, timeElapsed, score, winner, memoryDeck, flippedCards, matchedCards, snakeState, selectedCandy };
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved_games`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ game_state: saveData })
      });
      if (response.ok) setSysMessage('Đã lưu tiến trình trận đấu lên CLOUD!');
      else { setSysMessage('Lỗi lưu Cloud! Đã lưu tạm về máy.'); localStorage.setItem('saved_game_data_fallback', JSON.stringify(saveData)); }
    } catch (err) { setSysMessage('Mạng lỗi! Đã lưu tạm về máy.'); localStorage.setItem('saved_game_data_fallback', JSON.stringify(saveData)); }
  };

  const handleLoadGame = async () => {
    clearMessageOnAction();
    setSysMessage('Đang tải từ Cloud...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/saved_games`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        const fallback = localStorage.getItem('saved_game_data_fallback');
        if (fallback) { loadGameState(JSON.parse(fallback)); setSysMessage('Đã tải lại ván đấu từ bộ nhớ tạm.'); } 
        else setSysMessage('Không tìm thấy bản lưu nào!');
        return;
      }
      const data = await response.json();
      loadGameState(data.game_state); setSysMessage('Đã tải lại ván đấu từ CLOUD!');
    } catch (err) { setSysMessage('Lỗi tải từ Cloud!'); }
  };

  const loadGameState = (parsed) => {
    setActiveGame(parsed.activeGame); setBoardSize(parsed.boardSize); setBoard(parsed.board); setIsXNext(parsed.isXNext);
    setCursor(parsed.cursor); setTimeElapsed(parsed.timeElapsed); setScore(parsed.score); setWinner(parsed.winner || null);
    if (parsed.memoryDeck) { setMemoryDeck(parsed.memoryDeck); setFlippedCards(parsed.flippedCards || []); setMatchedCards(parsed.matchedCards || []); }
    if (parsed.snakeState) setSnakeState(parsed.snakeState);
    if (parsed.selectedCandy !== undefined) setSelectedCandy(parsed.selectedCandy);
    setGameState('PLAYING');
  };

  // --- LOGIC CHẠY GAME GIỮ NGUYÊN ---
  const getMatches = (currentBoard, size) => {
    let matchedIndices = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx+1] && currentBoard[idx] === currentBoard[idx+2]) {
          matchedIndices.add(idx).add(idx+1).add(idx+2); let k = 3; while (c + k < size && currentBoard[idx] === currentBoard[idx+k]) { matchedIndices.add(idx+k); k++; }
        }
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx+size] && currentBoard[idx] === currentBoard[idx+size*2]) {
          matchedIndices.add(idx).add(idx+size).add(idx+size*2); let k = 3; while (r + k < size && currentBoard[idx] === currentBoard[idx+k*size]) { matchedIndices.add(idx+k*size); k++; }
        }
      }
    }
    return Array.from(matchedIndices);
  };

  const applyGravity = (currentBoard, size) => {
    let newB = [...currentBoard];
    for (let c = 0; c < size; c++) {
      let colItems = [];
      for (let r = size - 1; r >= 0; r--) { if (newB[r * size + c] !== null) colItems.push(newB[r * size + c]); }
      while (colItems.length < size) { colItems.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]); }
      for (let r = size - 1; r >= 0; r--) { newB[r * size + c] = colItems[size - 1 - r]; }
    }
    return newB;
  };

  useEffect(() => {
    if (activeGame?.id !== 'MATCH3' || gameState !== 'PLAYING') return;
    let timeout1, timeout2;
    const processMatches = () => {
      const matches = getMatches(board, boardSize);
      if (matches.length > 0) {
        let tempBoard = [...board]; matches.forEach(i => tempBoard[i] = null); setBoard(tempBoard); setScore(s => s + matches.length * 10); 
        timeout2 = setTimeout(() => { setBoard(applyGravity(tempBoard, boardSize)); setMatch3Trigger(prev => prev + 1); }, 300);
      }
    };
    if (match3Trigger > 0) timeout1 = setTimeout(processMatches, 300);
    return () => { clearTimeout(timeout1); clearTimeout(timeout2); };
  }, [match3Trigger, board, activeGame, gameState, boardSize]);

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && !showHelp) timer = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, winner, activeGame, showHelp]);

  useEffect(() => {
    if (gameState !== 'PLAYING' || activeGame?.id !== 'SNAKE' || winner || !snakeState.isRunning || showHelp) return;
    const interval = setInterval(() => {
      setSnakeState(prev => {
        const head = prev.body[0]; let nextHead = head; const size = boardSize;
        if (prev.dir === 'UP') nextHead = head - size; if (prev.dir === 'DOWN') nextHead = head + size;
        if (prev.dir === 'LEFT') nextHead = head - 1; if (prev.dir === 'RIGHT') nextHead = head + 1;
        if ((prev.dir === 'UP' && nextHead < 0) || (prev.dir === 'DOWN' && nextHead >= size * size) || 
            (prev.dir === 'LEFT' && head % size === 0) || (prev.dir === 'RIGHT' && (head + 1) % size === 0) || prev.body.includes(nextHead)) {
          setWinner('MÁY THẮNG'); return { ...prev, isRunning: false };
        }
        const newBody = [nextHead, ...prev.body]; let newFood = prev.food; let newSpeed = prev.speed;
        if (nextHead === prev.food) {
          do { newFood = Math.floor(Math.random() * (size * size)); } while (newBody.includes(newFood));
          newSpeed = Math.max(80, prev.speed - 5); setScore(s => s + 10);
        } else { newBody.pop(); }
        return { ...prev, body: newBody, food: newFood, speed: newSpeed };
      });
    }, snakeState.speed);
    return () => clearInterval(interval);
  }, [gameState, activeGame, winner, boardSize, snakeState.isRunning, snakeState.speed, showHelp]);

  const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };
  const countInLine = (currentBoard, size, index, dRow, dCol) => {
    const player = currentBoard[index]; const row = Math.floor(index / size); const col = index % size; let count = 0;
    for (let i = 1; i <= 5; i++) { const r = row + dRow * i; const c = col + dCol * i; if (r >= 0 && r < size && c >= 0 && c < size && currentBoard[r * size + c] === player) count++; else break; } return count;
  };
  const checkWinner = (currentBoard, size, index, winRequirement) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let [dRow, dCol] of directions) { if (countInLine(currentBoard, size, index, dRow, dCol) + countInLine(currentBoard, size, index, -dRow, -dCol) + 1 >= winRequirement) return currentBoard[index]; } return null;
  };
  const findBestMove = (currentBoard, size, winRequirement) => {
    const emptyCells = currentBoard.map((cell, idx) => cell === null ? idx : null).filter(val => val !== null);
    let bestBlockMove = null, maxBlockCount = 0; let bestWinMove = null, maxWinCount = 0;
    for (const moveIndex of emptyCells) {
      currentBoard[moveIndex] = 'O'; if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'O') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = 'X'; if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'X') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = null; 
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        currentBoard[moveIndex] = 'X'; const playerLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol); if (playerLine > maxBlockCount) { maxBlockCount = playerLine; bestBlockMove = moveIndex; }
        currentBoard[moveIndex] = 'O'; const botLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol); if (botLine > maxWinCount) { maxWinCount = botLine; bestWinMove = moveIndex; }
        currentBoard[moveIndex] = null; 
      }
    }
    if (maxBlockCount >= winRequirement - 2) return bestBlockMove; if (maxWinCount >= winRequirement - 2) return bestWinMove; if (maxBlockCount >= Math.max(1, winRequirement - 3)) return bestBlockMove;
    if (emptyCells.length === 0) return null; return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const startGame = () => {
    const game = dynamicGameList[menuIndex];
    if (!game.enabled) { setSysMessage('TRÒ CHƠI NÀY ĐANG ĐƯỢC ADMIN BẢO TRÌ!'); return; }
    setActiveGame(game); const currentSize = game.currentSize; setBoardSize(currentSize);
    if (game.id === 'MEMORY') {
      const symbols = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🥝', '🍍']; const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5); 
      setMemoryDeck(deck); setBoard(Array(16).fill(null)); setFlippedCards([]); setMatchedCards([]); setWinner(null);
    } else if (game.id === 'SNAKE') {
      const startPos = Math.floor((currentSize * currentSize) / 2); setSnakeState({ body: [startPos, startPos + currentSize], food: 10, dir: 'UP', isRunning: false, speed: 200 }); setBoard(Array(currentSize * currentSize).fill(null)); setWinner(null);
    } else if (game.id === 'MATCH3') {
      let newB = Array(currentSize * currentSize).fill(null);
      for(let i=0; i<currentSize * currentSize; i++) {
        let randomCandy; do { randomCandy = CANDIES[Math.floor(Math.random() * CANDIES.length)]; let row = Math.floor(i/currentSize); let col = i%currentSize; let mLeft = col >= 2 && newB[i-1] === randomCandy && newB[i-2] === randomCandy; let mUp = row >= 2 && newB[i-currentSize] === randomCandy && newB[i-currentSize*2] === randomCandy; if(!mLeft && !mUp) break; } while(true);
        newB[i] = randomCandy;
      }
      setBoard(newB); setSelectedCandy(null); setWinner(null);
    } else { setBoard(Array(currentSize * currentSize).fill(null)); setWinner(null); }
    setCursor(Math.floor((currentSize * currentSize) / 2)); setIsXNext(true); setTimeElapsed(0); setScore(0); setSysMessage(''); setGameState('PLAYING');
  };

  const backToMenu = () => { clearMessageOnAction(); setGameState('MENU'); setActiveGame(null); };

  const moveCursor = (direction) => {
    if (showHelp) return; clearMessageOnAction();
    if (gameState === 'MENU') {
      if (direction === 'LEFT') setMenuIndex(prev => (prev === 0 ? dynamicGameList.length - 1 : prev - 1)); if (direction === 'RIGHT') setMenuIndex(prev => (prev === dynamicGameList.length - 1 ? 0 : prev + 1)); return;
    }
    if (winner) return; 
    if (activeGame?.id === 'SNAKE') { setSnakeState(prev => { let newDir = prev.dir; if (direction === 'UP' && prev.dir !== 'DOWN') newDir = 'UP'; if (direction === 'DOWN' && prev.dir !== 'UP') newDir = 'DOWN'; if (direction === 'LEFT' && prev.dir !== 'RIGHT') newDir = 'LEFT'; if (direction === 'RIGHT' && prev.dir !== 'LEFT') newDir = 'RIGHT'; return { ...prev, dir: newDir, isRunning: true }; }); return; }
    if (!isXNext) return; 
    setCursor((prev) => { const totalCells = boardSize * boardSize; if (direction === 'UP' && prev >= boardSize) return prev - boardSize; if (direction === 'DOWN' && prev < totalCells - boardSize) return prev + boardSize; if (direction === 'LEFT') return (prev - 1 + totalCells) % totalCells; if (direction === 'RIGHT') return (prev + 1) % totalCells; return prev; });
  };

  const handleEnter = () => {
    if (showHelp) return; clearMessageOnAction();
    if (gameState === 'MENU') { startGame(); return; } if (winner) { startGame(); return; } if (activeGame?.id === 'SNAKE' || !isXNext) return; 
    if (activeGame.id === 'DRAWING') { const newBoard = [...board]; newBoard[cursor] = newBoard[cursor] === null ? 'X' : newBoard[cursor] === 'X' ? 'O' : null; setBoard(newBoard); return; }
    if (activeGame.id === 'MATCH3') {
      if (selectedCandy === null) { setSelectedCandy(cursor); } 
      else {
        const r1 = Math.floor(selectedCandy / boardSize); const c1 = selectedCandy % boardSize; const r2 = Math.floor(cursor / boardSize); const c2 = cursor % boardSize; const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
        if (isAdjacent) { let tempBoard = [...board]; let temp = tempBoard[selectedCandy]; tempBoard[selectedCandy] = tempBoard[cursor]; tempBoard[cursor] = temp; let matches = getMatches(tempBoard, boardSize); if (matches.length > 0) { setBoard(tempBoard); setSelectedCandy(null); setMatch3Trigger(prev => prev + 1); } else { setSelectedCandy(null); } } else { setSelectedCandy(cursor); }
      } return;
    }
    if (activeGame.id === 'MEMORY') {
      if (flippedCards.includes(cursor) || matchedCards.includes(cursor) || flippedCards.length === 2) return; const newFlipped = [...flippedCards, cursor]; setFlippedCards(newFlipped);
      if (newFlipped.length === 2) { const [firstIndex, secondIndex] = newFlipped; if (memoryDeck[firstIndex] === memoryDeck[secondIndex]) { const newMatched = [...matchedCards, firstIndex, secondIndex]; setMatchedCards(newMatched); setFlippedCards([]); setScore(prev => prev + 20); if (newMatched.length === boardSize * boardSize) { setWinner('X'); saveScoreToRanking(score + 20); } } else { setTimeout(() => { setFlippedCards([]); }, 800); } } return; 
    }
    if (board[cursor] !== null) return; const newBoard = [...board]; newBoard[cursor] = 'X'; setBoard(newBoard);
    const playerWin = checkWinner(newBoard, boardSize, cursor, activeGame.winCount); if (playerWin) { setWinner('X'); setScore(100); saveScoreToRanking(100); return; } if (!newBoard.includes(null)) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); return; }
    setIsXNext(false); 
    setTimeout(() => {
      const smartMove = findBestMove(newBoard, boardSize, activeGame.winCount); if (smartMove === null) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); return; }
      const botBoard = [...newBoard]; botBoard[smartMove] = 'O'; setBoard(botBoard); const botWin = checkWinner(botBoard, boardSize, smartMove, activeGame.winCount); if (botWin) { setWinner('O'); setScore(0); saveScoreToRanking(0); } else if (!botBoard.includes(null)) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); } else { setIsXNext(true); }
    }, 400); 
  };

  return (
    <div className="modern-console-system">
      <div className="display-wrapper">
        <div className="game-info-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', alignItems: 'center', marginBottom: '12px' }}>
          <div><span className="player-name">{user.username || 'Người chơi'}</span>{gameState === 'PLAYING' && !winner && !['DRAWING', 'SNAKE', 'MATCH3'].includes(activeGame?.id) && (<span className="turn-text" style={{ marginLeft: '10px' }}><span className={`turn-marker ${isXNext ? 'x' : 'o'}`}></span><strong>{isXNext ? 'Lượt của bạn' : 'Máy đang nghĩ'}</strong></span>)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>{gameState === 'PLAYING' && (<div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 'bold' }}><span style={{ marginRight: '10px' }}>THỜI GIAN: <span style={{ color: 'white' }}>{formatTime(timeElapsed)}</span></span><span>ĐIỂM: <span style={{ color: '#FBBF24' }}>{score}</span></span></div>)}<div className="sys-btn-group"><button className="sys-btn" onClick={handleSaveGame}>LƯU</button><button className="sys-btn" onClick={handleLoadGame}>TẢI</button></div></div>
        </div>
        <div style={{ minHeight: '20px', textAlign: 'center', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#FB923C', letterSpacing: '1px' }}>{sysMessage}</div>
        
        {gameState === 'MENU' ? (
          <div className="menu-title"><span style={{ fontSize: '1rem', letterSpacing: '2px' }}>CHỌN TRÒ CHƠI</span><div style={{ display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap', marginTop:'10px' }}><span style={{ color: '#94A3B8' }}>&lt;&lt;</span><strong>{dynamicGameList[menuIndex]?.name}</strong><span style={{ color: '#94A3B8' }}>&gt;&gt;</span></div>{!dynamicGameList[menuIndex]?.enabled && (<div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '10px', fontWeight: 'bold' }}>[ GAME ĐANG BỊ KHÓA ]</div>)}</div>
        ) : (
          <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
            <div className="modern-board" style={{ display: 'grid', gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`, width: '100%', height: '100%', gap: '1px' }}>
              {board.map((cell, index) => {
                const isSelectedMatch3 = activeGame?.id === 'MATCH3' && selectedCandy === index;
                return (
                  <div key={index} className={`modern-cell ${gameState === 'PLAYING' && index === cursor && activeGame?.id !== 'SNAKE' ? 'cursor' : ''}`} style={isSelectedMatch3 ? { border: '2px solid #FBBF24', transform: 'scale(1.15)', zIndex: 5, backgroundColor: 'rgba(251, 191, 36, 0.2)' } : {}}>
                    {activeGame?.id === 'SNAKE' ? (<span className="cell-content" style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>{snakeState.body[0] === index ? '😋' : snakeState.body.includes(index) ? '🟩' : snakeState.food === index ? '🍎' : ''}</span>) : activeGame?.id === 'MEMORY' ? ((flippedCards.includes(index) || matchedCards.includes(index)) && (<span className="cell-content" style={{ fontSize: '30px' }}>{memoryDeck[index]}</span>)) : (cell && (<span className={`cell-content ${cell === 'X' ? 'x' : 'o'}`} style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>{activeGame?.id === 'DRAWING' ? '█' : cell}</span>))}
                  </div>
                );
              })}
            </div>
            {winner && (<div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0F172A', border: '2px solid #38BDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: winner === 'X' ? '#38BDF8' : winner === 'O' || winner === 'MÁY THẮNG' ? '#EF4444' : '#FBBF24', marginBottom: '15px' }}>{winner === 'COMING_SOON' ? 'ĐANG CẬP NHẬT' : winner === 'DRAW' ? 'HÒA CỜ' : winner === 'X' ? 'BẠN THẮNG' : 'GAME OVER'}</div><div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '15px', fontWeight: 'bold' }}>{winner === 'COMING_SOON' ? 'QUAY LẠI SAU NHÉ' : 'BẤM ENTER ĐỂ TIẾP TỤC'}</div></div>)}
          </div>
        )}
        {showHelp && (<div style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', border: '1px solid #38BDF8', padding: '15px', width: '220px', zIndex: 100, textAlign: 'center' }}><div style={{ color: '#FB923C', fontWeight: 'bold', marginBottom: '10px' }}>{gameState === 'MENU' ? dynamicGameList[menuIndex]?.name : activeGame.name}</div><div style={{ color: '#E2E8F0', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'left' }}>{gameState === 'MENU' ? dynamicGameList[menuIndex]?.help : activeGame.help}</div><button onClick={() => setShowHelp(false)} style={{ background: '#38BDF8', color: '#0F172A', border: 'none', padding: '5px 15px', fontWeight: 'bold', cursor: 'pointer' }}>ĐÓNG</button></div>)}
      </div>
      <div className="modern-controller">
        {gameState === 'MENU' ? (<div className="nav-menu-panel" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}><div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button></div><div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button></div></div>) : (<div className="d-pad-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}><div className="btn-wrapper" style={{gridColumn: 2, gridRow: 1}}><button className="flat-btn" onClick={() => moveCursor('UP')}>↑</button></div><div className="btn-wrapper" style={{gridColumn: 1, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button></div><div className="btn-wrapper" style={{gridColumn: 2, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('DOWN')}>↓</button></div><div className="btn-wrapper" style={{gridColumn: 3, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button></div></div>)}
        <div className="flat-btn-group" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}><div className="btn-wrapper"><button className="flat-action-btn yellow" onClick={backToMenu}>⮌</button><span className="btn-label">Quay lại</span></div><div className="btn-wrapper"><button className="flat-action-btn red" onClick={handleEnter}>↵</button><span className="btn-label">Chọn</span></div><div className="btn-wrapper"><button className="flat-action-btn blue" onClick={() => setShowHelp(true)}>?</button><span className="btn-label">Trợ giúp</span></div></div>
      </div>
    </div>
  );
};

export default GameConsole;