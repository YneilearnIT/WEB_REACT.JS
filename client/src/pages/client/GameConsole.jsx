import { useState, useEffect, useRef } from 'react';

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
  const [availableGames, setAvailableGames] = useState(GAME_LIST);
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
  const enterLockRef = useRef(false);
  const [adminOverlayMsg, setAdminOverlayMsg] = useState('');
  const prevConfigRef = useRef([]);

  useEffect(() => {
    const fetchGameConfig = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/games/config');
        if (res.ok) {
          const configData = await res.json();
          if (prevConfigRef.current.length > 0) {
            configData.forEach(newGame => {
              const oldGame = prevConfigRef.current.find(g => g.id === newGame.id);
              if (oldGame && oldGame.enabled !== newGame.enabled) {
                setAdminOverlayMsg(`GAME ${newGame.name} ${newGame.enabled ? 'ĐÃ ĐƯỢC MỞ LẠI' : 'VỪA BỊ KHÓA'}`);
                setTimeout(() => setAdminOverlayMsg(''), 3500);
              }
            });
          }
          prevConfigRef.current = configData;
          const activeIds = configData.filter(g => g.enabled).map(g => g.id);
          const filteredGames = GAME_LIST.filter(g => activeIds.includes(g.id));
          setAvailableGames(filteredGames);
          setMenuIndex(prev => prev >= filteredGames.length ? 0 : prev);
        }
      } catch (err) {}
    };
    fetchGameConfig();
    const interval = setInterval(fetchGameConfig, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING' && activeGame) {
      const isStillEnabled = availableGames.some(g => g.id === activeGame.id);
      if (!isStillEnabled) {
        setGameState('MENU'); setActiveGame(null); setWinner(null);
      }
    }
  }, [availableGames, activeGame, gameState]);

  const clearMessageOnAction = () => { if (sysMessage) setSysMessage(''); };

  const saveScoreToRanking = async (finalScore) => {
    try {
      if (!user || !user.id) return; 
      await fetch('http://localhost:5000/api/matches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, game_name: activeGame.name, score: finalScore, time_elapsed: timeElapsed })
      });
    } catch (err) {}
  };

  const triggerGameEnd = (result, finalScore) => {
    setWinner(result);
    if (finalScore !== undefined) { setScore(finalScore); saveScoreToRanking(finalScore); }
    enterLockRef.current = true;
    setTimeout(() => { enterLockRef.current = false; }, 1000);
  };

  const handleSendRating = async () => {
    setSysMessage("Đang gửi đánh giá...");
    try {
      await fetch("http://localhost:5000/api/games/rating", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, game_name: activeGame.name, rating: Number(rating), comment: comment.trim() }),
      });
      setSysMessage("Cảm ơn bạn đã đánh giá!"); setComment(""); setRating(5);
      setTimeout(() => { setWinner(null); setGameState("MENU"); setSysMessage(''); }, 1500);
    } catch (err) { setSysMessage("Lỗi gửi đánh giá!"); }
  };

  const handleSaveGame = () => {
    clearMessageOnAction();
    if (gameState !== 'PLAYING' || activeGame?.id === 'DRAWING') { setSysMessage('Chỉ có thể Lưu khi đang chơi.'); return; }
    const saveData = { activeGame, boardSize, board, isXNext, cursor, timeElapsed, score, winner, memoryDeck, flippedCards, matchedCards, snakeState, selectedCandy };
    localStorage.setItem('saved_game_data', JSON.stringify(saveData)); setSysMessage('Đã lưu tiến trình.');
  };

  const handleLoadGame = () => {
    clearMessageOnAction();
    const data = localStorage.getItem('saved_game_data');
    if (!data) { setSysMessage('Không có dữ liệu.'); return; }
    const p = JSON.parse(data);
    if (!availableGames.some(g => g.id === p.activeGame.id)) { setSysMessage('Game đã bị khóa.'); return; }
    setActiveGame(p.activeGame); setBoardSize(p.boardSize); setBoard(p.board); setIsXNext(p.isXNext); setCursor(p.cursor); setTimeElapsed(p.timeElapsed); setScore(p.score); setWinner(p.winner || null); setMemoryDeck(p.memoryDeck || []); setFlippedCards(p.flippedCards || []); setMatchedCards(p.matchedCards || []); setSnakeState(p.snakeState || { isRunning: false }); setSelectedCandy(p.selectedCandy); setGameState('PLAYING'); setSysMessage('Đã tải ván cũ.');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && !showHelp) { timer = setInterval(() => setTimeElapsed(p => p + 1), 1000); }
    return () => clearInterval(timer);
  }, [gameState, winner, activeGame, showHelp]);

  const getMatches = (currentBoard, size) => {
    let matchedIndices = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx + 1] && currentBoard[idx] === currentBoard[idx + 2]) { matchedIndices.add(idx).add(idx + 1).add(idx + 2); }
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx + size] && currentBoard[idx] === currentBoard[idx + size * 2]) { matchedIndices.add(idx).add(idx + size).add(idx + size * 2); }
      }
    }
    return Array.from(matchedIndices);
  };

  useEffect(() => {
    if (activeGame?.id !== "MATCH3" || gameState !== "PLAYING" || match3Trigger === 0) return;
    const matches = getMatches(board, boardSize);
    if (matches.length > 0) {
      setTimeout(() => {
        let tempBoard = [...board]; matches.forEach((i) => (tempBoard[i] = null));
        setBoard(tempBoard); setScore((s) => s + matches.length * 10);
        setTimeout(() => {
          for (let c = 0; c < boardSize; c++) {
            let colItems = [];
            for (let r = boardSize - 1; r >= 0; r--) if (tempBoard[r * boardSize + c] !== null) colItems.push(tempBoard[r * boardSize + c]);
            while (colItems.length < boardSize) colItems.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]);
            for (let r = boardSize - 1; r >= 0; r--) tempBoard[r * boardSize + c] = colItems[boardSize - 1 - r];
          }
          setBoard(tempBoard); setMatch3Trigger((prev) => prev + 1);
        }, 300);
      }, 300);
    } else { setMatch3Trigger(0); }
  }, [match3Trigger]);

  useEffect(() => {
    if (gameState !== "PLAYING" || activeGame?.id !== "SNAKE" || winner || !snakeState.isRunning || showHelp) return;
    const interval = setInterval(() => {
      setSnakeState((prev) => {
        const head = prev.body[0]; let nextHead;
        if (prev.dir === "UP") nextHead = head - boardSize; if (prev.dir === "DOWN") nextHead = head + boardSize; if (prev.dir === "LEFT") nextHead = head - 1; if (prev.dir === "RIGHT") nextHead = head + 1;
        if (nextHead < 0 || nextHead >= boardSize * boardSize || (prev.dir === "LEFT" && head % boardSize === 0) || (prev.dir === "RIGHT" && (head + 1) % boardSize === 0) || prev.body.includes(nextHead)) {
          triggerGameEnd("MÁY THẮNG", score); return { ...prev, isRunning: false };
        }
        const newBody = [nextHead, ...prev.body];
        if (nextHead === prev.food) {
          setScore((s) => s + 10);
          let newFood; do { newFood = Math.floor(Math.random() * (boardSize * boardSize)); } while (newBody.includes(newFood));
          return { ...prev, body: newBody, food: newFood, speed: Math.max(80, prev.speed - 2) };
        }
        newBody.pop(); return { ...prev, body: newBody };
      });
    }, snakeState.speed);
    return () => clearInterval(interval);
  }, [snakeState.isRunning, snakeState.speed, gameState, winner, showHelp]);

  const countInLine = (currentBoard, size, index, dRow, dCol) => {
    const player = currentBoard[index]; const row = Math.floor(index / size); const col = index % size; let count = 0;
    for (let i = 1; i <= 5; i++) {
      const r = row + dRow * i; const c = col + dCol * i;
      if (r >= 0 && r < size && c >= 0 && c < size && currentBoard[r * size + c] === player) count++; else break;
    }
    return count;
  };

  const checkWinner = (currentBoard, size, index, winRequirement) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let [dRow, dCol] of directions) {
      if (countInLine(currentBoard, size, index, dRow, dCol) + countInLine(currentBoard, size, index, -dRow, -dCol) + 1 >= winRequirement) return currentBoard[index];
    }
    return null;
  };

  const findBestMove = (currentBoard, size, winRequirement) => {
    const emptyCells = currentBoard.map((cell, idx) => cell === null ? idx : null).filter(val => val !== null);
    let bestBlockMove = null, maxBlockCount = 0, bestWinMove = null, maxWinCount = 0;
    for (const moveIndex of emptyCells) {
      currentBoard[moveIndex] = 'O'; if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'O') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = 'X'; if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'X') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = null; 
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        currentBoard[moveIndex] = 'X'; const playerLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (playerLine > maxBlockCount) { maxBlockCount = playerLine; bestBlockMove = moveIndex; }
        currentBoard[moveIndex] = 'O'; const botLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (botLine > maxWinCount) { maxWinCount = botLine; bestWinMove = moveIndex; }
        currentBoard[moveIndex] = null; 
      }
    }
    if (maxBlockCount >= winRequirement - 2) return bestBlockMove; 
    if (maxWinCount >= winRequirement - 2) return bestWinMove;
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const startGame = () => {
    const game = availableGames[menuIndex]; if (!game) return;
    setActiveGame(game); setBoardSize(game.initialSize); setCursor(Math.floor((game.initialSize * game.initialSize) / 2));
    setIsXNext(true); setWinner(null); setTimeElapsed(0); setScore(0); setSysMessage(''); setGameState('PLAYING');
    if (game.id === "MEMORY") {
      const s = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍓", "🥝", "🍍"]; setMemoryDeck([...s, ...s].sort(() => Math.random() - 0.5)); setBoard(Array(16).fill(null)); setMatchedCards([]); setFlippedCards([]);
    } else if (game.id === "SNAKE") {
      setSnakeState({ body: [22, 37], food: 10, dir: "UP", isRunning: false, speed: 200 }); setBoard(Array(225).fill(null));
    } else if (game.id === "MATCH3") {
      let nb = []; for (let i = 0; i < 64; i++) nb.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]); setBoard(nb); setSelectedCandy(null);
    } else { setBoard(Array(game.initialSize * game.initialSize).fill(null)); }
  };

  const backToMenu = () => { clearMessageOnAction(); setGameState('MENU'); setActiveGame(null); };

  const moveCursor = (direction) => {
    if (showHelp) return; clearMessageOnAction();
    if (gameState === 'MENU') {
      if (availableGames.length === 0) return;
      if (direction === 'LEFT') setMenuIndex(prev => (prev === 0 ? availableGames.length - 1 : prev - 1));
      if (direction === 'RIGHT') setMenuIndex(prev => (prev === availableGames.length - 1 ? 0 : prev + 1));
      return;
    }
    if (winner || !isXNext) return; 
    if (activeGame?.id === "SNAKE") {
      setSnakeState((p) => {
        let nD = p.dir;
        if (direction === "UP" && p.dir !== "DOWN") nD = "UP"; if (direction === "DOWN" && p.dir !== "UP") nD = "DOWN"; if (direction === "LEFT" && p.dir !== "RIGHT") nD = "LEFT"; if (direction === "RIGHT" && p.dir !== "LEFT") nD = "RIGHT";
        return { ...p, dir: nD, isRunning: true };
      }); return;
    }
    setCursor((prev) => {
      if (direction === 'UP' && prev >= boardSize) return prev - boardSize; if (direction === 'DOWN' && prev < (boardSize * boardSize) - boardSize) return prev + boardSize; if (direction === 'LEFT' && prev % boardSize !== 0) return prev - 1; if (direction === 'RIGHT' && (prev + 1) % boardSize !== 0) return prev + 1;
      return prev;
    });
  };

  const handleEnter = () => {
    if (showHelp) return; clearMessageOnAction();
    if (gameState === 'MENU') { startGame(); return; }
    if (winner) { if (enterLockRef.current) return; startGame(); return; }
    
    if (!isXNext || activeGame?.id === "SNAKE") return;
    
    if (activeGame.id === "MEMORY") {
      if (flippedCards.includes(cursor) || matchedCards.includes(cursor) || flippedCards.length === 2) return;
      const newF = [...flippedCards, cursor]; setFlippedCards(newF);
      if (newF.length === 2) {
        if (memoryDeck[newF[0]] === memoryDeck[newF[1]]) {
          const newM = [...matchedCards, ...newF]; setMatchedCards(newM); setFlippedCards([]); setScore((s) => s + 20);
          if (newM.length === boardSize * boardSize) { triggerGameEnd("X", score + 20); }
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
      const newBoard = [...board]; newBoard[cursor] = newBoard[cursor] === null ? 'X' : newBoard[cursor] === 'X' ? 'O' : null; setBoard(newBoard); return;
    }
    
    if (board[cursor] !== null) return;
    
    const newBoard = [...board]; newBoard[cursor] = 'X'; setBoard(newBoard);
    if (checkWinner(newBoard, boardSize, cursor, activeGame.winCount)) { triggerGameEnd('X', 100); return; }
    if (!newBoard.includes(null)) { triggerGameEnd('DRAW', 10); return; }

    setIsXNext(false); 
    setTimeout(() => {
      const smartMove = findBestMove(newBoard, boardSize, activeGame.winCount);
      if (smartMove === null) { triggerGameEnd('DRAW', 10); return; }
      const botBoard = [...newBoard]; botBoard[smartMove] = 'O'; setBoard(botBoard);
      if (checkWinner(botBoard, boardSize, smartMove, activeGame.winCount)) { triggerGameEnd('O', 0); } 
      else if (!botBoard.includes(null)) { triggerGameEnd('DRAW', 10); } 
      else { setIsXNext(true); }
    }, 400); 
  };

  return (
    <div style={{ width: '340px', height: '680px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: '0.3s', position: 'relative' }}>
      
      {adminOverlayMsg && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--bg-panel)', border: '4px solid var(--accent-red)', color: 'var(--accent-red)', padding: '20px 15px', borderRadius: '12px', fontWeight: '900', fontSize: '1.2rem', textAlign: 'center', zIndex: 10000, width: '90%', boxSizing: 'border-box' }}>
          {adminOverlayMsg}
        </div>
      )}

      {/* MÀN HÌNH CHÍNH */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', position: 'relative', width: '100%', boxSizing: 'border-box', transition: '0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ color: 'var(--accent-orange)', fontWeight: 'bold' }}>{user.username || 'Người chơi'}</span>
            {gameState === 'PLAYING' && !winner && (
              <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '6px', backgroundColor: isXNext ? 'var(--accent-blue)' : 'var(--accent-red)' }}></span>
                <strong>{isXNext ? 'Lượt bạn' : 'Máy nghĩ'}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {gameState === 'PLAYING' && (
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  <span style={{ marginRight: '10px' }}>TG: <span style={{ color: 'var(--text-main)' }}>{formatTime(timeElapsed)}</span></span>
                  <span>ĐIỂM: <span style={{ color: 'var(--accent-yellow)' }}>{score}</span></span>
               </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
               <button onClick={handleSaveGame} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>LƯU</button>
               <button onClick={handleLoadGame} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>TẢI</button>
            </div>
          </div>
        </div>

        <div style={{ minHeight: '20px', textAlign: 'center', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{sysMessage}</div>
        
        {gameState === 'MENU' ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '280px', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'center', gap: '20px' }}>
            <span style={{ fontSize: '1rem' }}>CHỌN TRÒ CHƠI</span>
            {availableGames.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: 'var(--text-muted)' }}>&lt;&lt;</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.4rem' }}>{availableGames[menuIndex]?.name}</strong>
                <span style={{ color: 'var(--text-muted)' }}>&gt;&gt;</span>
              </div>
            ) : ( <div style={{ color: 'var(--accent-red)', marginTop: '15px' }}>ĐANG BẢO TRÌ TRÒ CHƠI</div> )}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`, width: '100%', height: '100%', gap: '1px', transition: '0.3s' }}>
              {board.map((cell, index) => (
                <div key={index} style={{ background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: gameState === 'PLAYING' && index === cursor && activeGame?.id !== 'SNAKE' ? '2px solid var(--accent-blue)' : 'none', ...(activeGame?.id === 'MATCH3' && selectedCandy === index ? { border: "2px solid var(--accent-yellow)" } : {}) }}>
                  {activeGame?.id === 'SNAKE' ? ( snakeState.body[0] === index ? "😋" : snakeState.body.includes(index) ? "🟩" : snakeState.food === index ? "🍎" : "" ) 
                  : activeGame?.id === 'MEMORY' ? ( (flippedCards.includes(index) || matchedCards.includes(index)) ? memoryDeck[index] : "" ) 
                  : cell && ( <span style={{ fontWeight: 'bold', color: cell === 'X' ? 'var(--accent-blue)' : 'var(--accent-red)', fontSize: `${Math.max(14, 200 / boardSize)}px` }}>{activeGame?.id === 'DRAWING' ? '█' : cell}</span> )}
                </div>
              ))}
            </div>
            
            {/* THÔNG BÁO VÀ ĐÁNH GIÁ (NẰM GỌN GIỮA MÀN HÌNH) */}
            {winner && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--bg-panel)', border: '2px solid var(--accent-blue)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '15px', width: '90%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: winner === 'X' ? 'var(--accent-blue)' : winner === 'O' ? 'var(--accent-red)' : 'var(--accent-yellow)', marginBottom: '10px' }}>
                  {winner === 'DRAW' ? 'HÒA CỜ' : winner === 'X' ? 'BẠN THẮNG' : 'MÁY THẮNG'}
                </div>
                
                <div style={{ width: "100%", background: "var(--bg-app)", padding: "10px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent-yellow)", textAlign: "center", fontWeight: "bold" }}>ĐÁNH GIÁ (Tùy chọn)</div>
                  <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: "4px", background: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border-color)", outline: 'none', borderRadius: '4px' }}>
                    <option value="5">⭐⭐⭐⭐⭐ Tuyệt</option><option value="4">⭐⭐⭐⭐ Tốt</option><option value="3">⭐⭐⭐ Thường</option><option value="2">⭐⭐ Tệ</option><option value="1">⭐ Rất tệ</option>
                  </select>
                  <input placeholder="Bình luận..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ padding: "6px", background: "var(--bg-panel)", color: "var(--text-main)", border: "1px solid var(--border-color)", outline: 'none', borderRadius: '4px', fontSize: '0.8rem' }} />
                  <button onClick={handleSendRating} style={{ background: "var(--accent-green)", border: "none", color: "white", fontWeight: "bold", padding: "6px", cursor: 'pointer', borderRadius: '4px' }}>GỬI</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>BẤM ENTER (↵) CHƠI LẠI</div>
              </div>
            )}
          </div>
        )}
        
        {showHelp && (
           <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '15px', zIndex: 100, textAlign: 'center' }}>
             <div style={{ color: 'var(--accent-orange)', fontWeight: 'bold', marginBottom: '10px' }}>{gameState === 'MENU' ? availableGames[menuIndex]?.name : activeGame?.name}</div>
             <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'left' }}>{gameState === 'MENU' ? availableGames[menuIndex]?.help : activeGame?.help}</div>
             <button onClick={() => setShowHelp(false)} style={{ background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '5px 15px', fontWeight: 'bold', borderRadius: '4px' }}>ĐÓNG</button>
           </div>
        )}
      </div>

      {/* ĐIỀU KHIỂN BÊN DƯỚI */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: '0.3s' }}>
        {gameState === 'MENU' ? (
          <div style={{ display: 'flex', gap: '50px', marginBottom: '20px' }}>
            <button style={{ width: '50px', height: '50px', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', transition: '0.3s' }} onClick={() => moveCursor('LEFT')}>←</button>
            <button style={{ width: '50px', height: '50px', background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', transition: '0.3s' }} onClick={() => moveCursor('RIGHT')}>→</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '50px 50px 50px', gridTemplateRows: '50px 50px', gap: '10px', marginBottom: '20px' }}>
            <button style={{ gridColumn: 2, gridRow: 1, background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => moveCursor('UP')}>↑</button>
            <button style={{ gridColumn: 1, gridRow: 2, background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => moveCursor('LEFT')}>←</button>
            <button style={{ gridColumn: 2, gridRow: 2, background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => moveCursor('DOWN')}>↓</button>
            <button style={{ gridColumn: 3, gridRow: 2, background: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => moveCursor('RIGHT')}>→</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={backToMenu} style={{ width: '50px', height: '50px', background: 'var(--accent-yellow)', color: 'white', border: 'none', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }}>⮌</button>
          <button onClick={handleEnter} style={{ width: '50px', height: '50px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }}>↵</button>
          <button onClick={() => setShowHelp(true)} style={{ width: '50px', height: '50px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' }}>?</button>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default GameConsole;