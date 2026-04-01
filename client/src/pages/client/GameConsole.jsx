import { useState, useEffect } from 'react';
import './GameConsole.css';

const GAME_LIST = [
  { id: 'CARO_5', name: 'CARO HÀNG 5', winCount: 5, initialSize: 10, help: 'Luân phiên đánh X và O. Người nào tạo được 1 hàng 5 quân liên tiếp sẽ thắng.' },
  { id: 'CARO_4', name: 'CARO HÀNG 4', winCount: 4, initialSize: 10, help: 'Luân phiên đánh X và O. Người nào tạo được 1 hàng 4 quân liên tiếp sẽ thắng.' },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', winCount: 3, initialSize: 3, help: 'Bàn cờ 3x3. Ai nối được 3 quân liên tiếp sẽ thắng. Kín bàn là hòa.' },
  { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', initialSize: 15, help: 'Di chuyển con trỏ và bấm Chọn (Enter) để tô màu. Không tính thắng thua.' },
  { id: 'SNAKE', name: 'RẮN SĂN MỒI', initialSize: 15, help: 'Dùng phím điều hướng để di chuyển. Ăn táo để tăng điểm.' },
  { id: 'MATCH3', name: 'GHÉP HÀNG 3', initialSize: 8, help: 'Bấm Chọn (Enter) viên kẹo, di chuyển rồi Chọn lần nữa để đổi chỗ tạo hàng 3.' },
  { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', initialSize: 4, help: 'Di chuyển và bấm Chọn (Enter) để lật 2 thẻ bài giống nhau.' }
];

const CANDIES = ["🔴", "🟡", "🟢", "🔵", "🟣"];

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

  const [memoryDeck, setMemoryDeck] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [snakeState, setSnakeState] = useState({ body: [], food: null, dir: "UP", isRunning: false, speed: 200 });
  const [selectedCandy, setSelectedCandy] = useState(null);
  const [match3Trigger, setMatch3Trigger] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const clearMessageOnAction = () => {
    if (sysMessage) setSysMessage('');
  };

  const saveScoreToRanking = async (finalScore) => {
    try {
      if (!user || !user.id) return; 
      await fetch('http://localhost:5000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          game_name: activeGame.name,
          score: finalScore,
          time_elapsed: timeElapsed
        })
      });
    } catch (err) {
      console.log('Loi luu diem:', err);
    }
  };

  const handleSendRating = async () => {
    if (!comment.trim()) return;
    try {
      await fetch("http://localhost:5000/api/games/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          game_name: activeGame.name,
          rating,
          comment,
        }),
      });
      setSysMessage("Cảm ơn bạn đã đánh giá!");
      setComment("");
      setWinner(null);
      setGameState("MENU");
    } catch (err) { console.log(err); }
  };

  const handleSaveGame = () => {
    clearMessageOnAction();
    if (gameState !== 'PLAYING' || activeGame?.id === 'DRAWING') {
      setSysMessage('Chỉ có thể Lưu khi đang trong trận đấu.'); return;
    }
    const saveData = { 
      activeGame, boardSize, board, isXNext, cursor, timeElapsed, score, winner,
      memoryDeck, flippedCards, matchedCards, snakeState, selectedCandy 
    };
    localStorage.setItem('saved_game_data', JSON.stringify(saveData));
    setSysMessage('Đã lưu tiến trình trận đấu.');
  };

  const handleLoadGame = () => {
    clearMessageOnAction();
    const data = localStorage.getItem('saved_game_data');
    if (!data) { setSysMessage('Không tìm thấy dữ liệu đã lưu.'); return; }
    const p = JSON.parse(data);
    setActiveGame(p.activeGame); setBoardSize(p.boardSize); setBoard(p.board);
    setIsXNext(p.isXNext); setCursor(p.cursor); setTimeElapsed(p.timeElapsed);
    setScore(p.score); setWinner(p.winner || null); 
    setMemoryDeck(p.memoryDeck || []); setFlippedCards(p.flippedCards || []); setMatchedCards(p.matchedCards || []);
    setSnakeState(p.snakeState || { isRunning: false }); setSelectedCandy(p.selectedCandy);
    setGameState('PLAYING'); setSysMessage('Đã tải lại ván đấu cũ.');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && !showHelp) {
      timer = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, winner, activeGame, showHelp]);

  const getMatches = (currentBoard, size) => {
    let matchedIndices = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx + 1] && currentBoard[idx] === currentBoard[idx + 2]) {
          matchedIndices.add(idx).add(idx + 1).add(idx + 2);
        }
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx + size] && currentBoard[idx] === currentBoard[idx + size * 2]) {
          matchedIndices.add(idx).add(idx + size).add(idx + size * 2);
        }
      }
    }
    return Array.from(matchedIndices);
  };

  useEffect(() => {
    if (activeGame?.id !== "MATCH3" || gameState !== "PLAYING" || match3Trigger === 0) return;
    const matches = getMatches(board, boardSize);
    if (matches.length > 0) {
      setTimeout(() => {
        let tempBoard = [...board];
        matches.forEach((i) => (tempBoard[i] = null));
        setBoard(tempBoard);
        setScore((s) => s + matches.length * 10);
        setTimeout(() => {
          for (let c = 0; c < boardSize; c++) {
            let colItems = [];
            for (let r = boardSize - 1; r >= 0; r--) if (tempBoard[r * boardSize + c] !== null) colItems.push(tempBoard[r * boardSize + c]);
            while (colItems.length < boardSize) colItems.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]);
            for (let r = boardSize - 1; r >= 0; r--) tempBoard[r * boardSize + c] = colItems[boardSize - 1 - r];
          }
          setBoard(tempBoard);
          setMatch3Trigger((prev) => prev + 1);
        }, 300);
      }, 300);
    } else {
      setMatch3Trigger(0);
    }
  }, [match3Trigger]);

  useEffect(() => {
    if (gameState !== "PLAYING" || activeGame?.id !== "SNAKE" || winner || !snakeState.isRunning || showHelp) return;
    const interval = setInterval(() => {
      setSnakeState((prev) => {
        const head = prev.body[0];
        let nextHead;
        if (prev.dir === "UP") nextHead = head - boardSize;
        if (prev.dir === "DOWN") nextHead = head + boardSize;
        if (prev.dir === "LEFT") nextHead = head - 1;
        if (prev.dir === "RIGHT") nextHead = head + 1;

        if (nextHead < 0 || nextHead >= boardSize * boardSize || (prev.dir === "LEFT" && head % boardSize === 0) || (prev.dir === "RIGHT" && (head + 1) % boardSize === 0) || prev.body.includes(nextHead)) {
          setWinner("MÁY THẮNG"); saveScoreToRanking(score);
          return { ...prev, isRunning: false };
        }
        const newBody = [nextHead, ...prev.body];
        if (nextHead === prev.food) {
          setScore((s) => s + 10);
          let newFood;
          do { newFood = Math.floor(Math.random() * (boardSize * boardSize)); } while (newBody.includes(newFood));
          return { ...prev, body: newBody, food: newFood, speed: Math.max(80, prev.speed - 2) };
        }
        newBody.pop();
        return { ...prev, body: newBody };
      });
    }, snakeState.speed);
    return () => clearInterval(interval);
  }, [snakeState.isRunning, snakeState.speed, gameState, winner, showHelp]);

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
    setCursor(Math.floor((game.initialSize * game.initialSize) / 2));
    setIsXNext(true);
    setWinner(null);
    setTimeElapsed(0);
    setScore(0);
    setSysMessage('');
    setGameState('PLAYING');

    if (game.id === "MEMORY") {
      const s = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍓", "🥝", "🍍"];
      setMemoryDeck([...s, ...s].sort(() => Math.random() - 0.5));
      setBoard(Array(16).fill(null)); setMatchedCards([]); setFlippedCards([]);
    } else if (game.id === "SNAKE") {
      setSnakeState({ body: [22, 37], food: 10, dir: "UP", isRunning: false, speed: 200 });
      setBoard(Array(225).fill(null));
    } else if (game.id === "MATCH3") {
      let nb = []; for (let i = 0; i < 64; i++) nb.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]);
      setBoard(nb); setSelectedCandy(null);
    } else {
      setBoard(Array(game.initialSize * game.initialSize).fill(null));
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

    if (activeGame?.id === "SNAKE") {
      setSnakeState((p) => {
        let nD = p.dir;
        if (direction === "UP" && p.dir !== "DOWN") nD = "UP";
        if (direction === "DOWN" && p.dir !== "UP") nD = "DOWN";
        if (direction === "LEFT" && p.dir !== "RIGHT") nD = "LEFT";
        if (direction === "RIGHT" && p.dir !== "LEFT") nD = "RIGHT";
        return { ...p, dir: nD, isRunning: true };
      });
      return;
    }

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
    if (activeGame?.id === "SNAKE") return;
    
    if (activeGame.id === "MEMORY") {
      if (flippedCards.includes(cursor) || matchedCards.includes(cursor) || flippedCards.length === 2) return;
      const newF = [...flippedCards, cursor]; setFlippedCards(newF);
      if (newF.length === 2) {
        if (memoryDeck[newF[0]] === memoryDeck[newF[1]]) {
          const newM = [...matchedCards, ...newF]; setMatchedCards(newM); setFlippedCards([]); setScore((s) => s + 20);
          if (newM.length === boardSize * boardSize) { setWinner("X"); saveScoreToRanking(score + 20); }
        } else { setTimeout(() => setFlippedCards([]), 800); }
      }
      return;
    }

    if (activeGame.id === "MATCH3") {
      if (selectedCandy === null) { setSelectedCandy(cursor); }
      else {
        const dist = Math.abs(Math.floor(selectedCandy / 8) - Math.floor(cursor / 8)) + Math.abs((selectedCandy % 8) - (cursor % 8));
        if (dist === 1) {
          let nb = [...board]; [nb[selectedCandy], nb[cursor]] = [nb[cursor], nb[selectedCandy]];
          if (getMatches(nb, 8).length > 0) { setBoard(nb); setMatch3Trigger(1); }
        }
        setSelectedCandy(null);
      }
      return;
    }

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
    
    const playerWin = checkWinner(newBoard, boardSize, cursor, activeGame.winCount);
    if (playerWin) { 
      setWinner('X'); setScore(100); saveScoreToRanking(100);
      return; 
    }
    if (!newBoard.includes(null)) { 
      setWinner('DRAW'); setScore(10); saveScoreToRanking(10);
      return; 
    }

    setIsXNext(false); 

    setTimeout(() => {
      const smartMove = findBestMove(newBoard, boardSize, activeGame.winCount);
      if (smartMove === null) { 
        setWinner('DRAW'); setScore(10); saveScoreToRanking(10);
        return; 
      }
      const botBoard = [...newBoard];
      botBoard[smartMove] = 'O';
      setBoard(botBoard);
      
      const botWin = checkWinner(botBoard, boardSize, smartMove, activeGame.winCount);
      if (botWin) { 
        setWinner('O'); setScore(0); saveScoreToRanking(0);
      } 
      else if (!botBoard.includes(null)) { 
        setWinner('DRAW'); setScore(10); saveScoreToRanking(10);
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
          {sysMessage}
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
          <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
            <div 
              className="modern-board" 
              style={{
                display: 'grid', gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`, width: '100%', height: '100%', gap: '1px'
              }}
            >
              {board.map((cell, index) => (
                <div key={index} 
                     className={`modern-cell ${gameState === 'PLAYING' && index === cursor && activeGame?.id !== 'SNAKE' ? 'cursor' : ''}`}
                     style={activeGame?.id === 'MATCH3' && selectedCandy === index ? { border: "2px solid #FBBF24", transform: "scale(1.1)" } : {}}
                >
                  {activeGame?.id === 'SNAKE' ? (
                    snakeState.body[0] === index ? "😋" : snakeState.body.includes(index) ? "🟩" : snakeState.food === index ? "🍎" : ""
                  ) : activeGame?.id === 'MEMORY' ? (
                    (flippedCards.includes(index) || matchedCards.includes(index)) ? memoryDeck[index] : ""
                  ) : cell && (
                    <span className={`cell-content ${cell === 'X' ? 'x' : 'o'}`} style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>
                      {activeGame?.id === 'DRAWING' ? '█' : cell}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* OVERLAY THÔNG BÁO KẾT THÚC GAME VÀ ĐÁNH GIÁ ĐƯỢC GIỮ NGUYÊN CẤU TRÚC GIAO DIỆN */}
            {winner && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#0F172A', border: '2px solid #38BDF8',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                zIndex: 10, padding: '10px', boxSizing: 'border-box'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: winner === 'X' ? '#38BDF8' : winner === 'O' ? '#EF4444' : '#FBBF24', marginBottom: '8px' }}>
                  {winner === 'DRAW' ? 'HÒA CỜ' : winner === 'X' ? 'BẠN THẮNG' : 'MÁY THẮNG'}
                </div>
                
                {/* Form Đánh Giá lồng vào để lấy điểm Tiêu chí */}
                <div style={{ width: "100%", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8", textAlign: "center" }}>ĐÁNH GIÁ TRÒ CHƠI</div>
                  <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: "4px", background: "#1E293B", color: "white", border: "1px solid #334155", borderRadius: "4px", outline: "none", fontSize: "0.8rem" }}>
                    <option value="5">⭐⭐⭐⭐⭐ Tuyệt vời</option>
                    <option value="4">⭐⭐⭐⭐ Tốt</option>
                    <option value="3">⭐⭐⭐ Bình thường</option>
                    <option value="2">⭐⭐ Tệ</option>
                    <option value="1">⭐ Rất tệ</option>
                  </select>
                  <input placeholder="Bình luận..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ padding: "4px", background: "#1E293B", color: "white", border: "1px solid #334155", borderRadius: "4px", fontSize: "0.8rem", outline: "none" }} />
                  <button onClick={handleSendRating} style={{ background: "#38BDF8", border: "none", color: "#0F172A", fontWeight: "bold", padding: "4px", borderRadius: "4px", cursor: "pointer" }}>GỬI BÌNH LUẬN</button>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '8px', fontWeight: 'bold' }}>
                  HOẶC BẤM ENTER ĐỂ CHƠI LẠI
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  ĐIỂM: <span style={{ color: '#FBBF24' }}>{score}</span> | THỜI GIAN: <span style={{ color: 'white' }}>{formatTime(timeElapsed)}</span>
                </div>
              </div>
            )}
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